import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, RefreshCw, Download, Calendar, X, 
  SlidersHorizontal, Clock, Sparkles, ArrowDownToDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ModernOrdersSearchProps {
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

const statusOptions = [
  { value: "all", label: "كل الحالات", dot: "bg-muted-foreground" },
  { value: "pending", label: "قيد الانتظار", dot: "bg-amber-500" },
  { value: "processing", label: "قيد المعالجة", dot: "bg-blue-500" },
  { value: "in_progress", label: "قيد التنفيذ", dot: "bg-primary" },
  { value: "completed", label: "مكتمل", dot: "bg-emerald-500" },
  { value: "partial", label: "مكتمل جزئي", dot: "bg-orange-500" },
  { value: "cancelled", label: "ملغي", dot: "bg-red-500" },
  { value: "refunded", label: "مسترجع", dot: "bg-purple-500" },
];

const quickDateFilters = [
  { label: "اليوم", days: 0, icon: Sparkles },
  { label: "آخر 7 أيام", days: 7 },
  { label: "آخر 30 يوم", days: 30 },
  { label: "آخر 3 أشهر", days: 90 },
];

export const ModernOrdersSearch = ({
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
}: ModernOrdersSearchProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasActiveFilters = statusFilter !== "all" || dateRange.from || dateRange.to || searchQuery;

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 relative"
      dir="rtl"
    >
      {/* Decorative Background */}
      <motion.div 
        className="absolute -top-10 right-0 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Main Search Row */}
      <div className="flex flex-col lg:flex-row gap-3 relative">
        {/* Enhanced Search Input */}
        <motion.div 
          className={cn(
            "relative flex-1 group",
            isFocused && "z-10"
          )}
          animate={{ scale: isFocused ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-l from-primary/20 to-accent/20 opacity-0 blur transition-opacity duration-300",
            isFocused && "opacity-100"
          )} />
          
          <div className="relative">
            <motion.div
              className="absolute right-4 top-1/2 -translate-y-1/2"
              animate={{ rotate: isFocused ? [0, -10, 10, 0] : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Search className={cn(
                "w-5 h-5 transition-colors duration-300",
                isFocused ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.div>
            
            <Input
              placeholder="البحث برقم الطلب أو اسم الخدمة..."
              className={cn(
                "h-14 pr-14 pl-12 bg-card/90 backdrop-blur-sm border-border/50 rounded-2xl text-base",
                "transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                "placeholder:text-muted-foreground/70"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            
            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Status Filter with Enhanced Styling */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "w-full lg:w-52 h-14 rounded-2xl bg-card/90 backdrop-blur-sm border-border/50",
              "hover:border-primary/50 transition-all duration-300",
              statusFilter !== "all" && "border-primary/50 bg-primary/5"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center",
                  statusFilter !== "all" ? "bg-primary/20" : "bg-muted"
                )}>
                  <Filter className={cn(
                    "w-4 h-4",
                    statusFilter !== "all" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <SelectValue placeholder="الحالة" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className={cn("w-2.5 h-2.5 rounded-full", option.dot)}
                      animate={option.value === statusFilter ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Date Range with Enhanced Design */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className={cn(
                  "h-14 px-5 rounded-2xl border-border/50 bg-card/90 backdrop-blur-sm gap-3",
                  "hover:border-primary/50 transition-all duration-300",
                  (dateRange.from || dateRange.to) && "border-primary/50 bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center",
                  (dateRange.from || dateRange.to) ? "bg-primary/20" : "bg-muted"
                )}>
                  <Calendar className={cn(
                    "w-4 h-4",
                    (dateRange.from || dateRange.to) ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                {dateRange.from ? (
                  dateRange.to ? (
                    <span className="text-sm font-medium">
                      {format(dateRange.from, "d MMM", { locale: ar })} - {format(dateRange.to, "d MMM", { locale: ar })}
                    </span>
                  ) : (
                    format(dateRange.from, "d MMM yyyy", { locale: ar })
                  )
                ) : (
                  <span className="text-muted-foreground">التاريخ</span>
                )}
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="end">
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
                  className="w-full rounded-xl hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setDateRange({ from: undefined, to: undefined });
                    setCalendarOpen(false);
                  }}
                >
                  <X className="w-4 h-4 ml-2" />
                  مسح التاريخ
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Toggle */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            className={cn(
              "h-14 px-5 rounded-2xl border-border/50 gap-3",
              "transition-all duration-300",
              showAdvanced && "bg-gradient-to-l from-primary/20 to-accent/20 border-primary/50"
            )}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </motion.div>
            <span className="hidden sm:inline font-medium">خيارات متقدمة</span>
          </Button>
        </motion.div>

        {/* Action Buttons with Enhanced Design */}
        <div className="flex gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 180 }} 
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                "h-14 w-14 rounded-2xl border-border/50",
                "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
                "transition-all duration-300"
              )}
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            </Button>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.1, y: -2 }} 
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={onExport}
              className={cn(
                "h-14 w-14 rounded-2xl border-border/50",
                "hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500",
                "transition-all duration-300"
              )}
            >
              <Download className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Active Filters with Enhanced Design */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Badge 
                variant="secondary" 
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                <ArrowDownToDot className="w-4 h-4 ml-2" />
                {filteredCount} من {totalCount} طلب
              </Badge>
            </motion.div>

            {statusFilter !== "all" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Badge 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={() => setStatusFilter("all")}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    statusOptions.find(s => s.value === statusFilter)?.dot
                  )} />
                  {statusOptions.find(s => s.value === statusFilter)?.label}
                  <X className="w-3.5 h-3.5 hover:text-destructive transition-colors" />
                </Badge>
              </motion.div>
            )}

            {(dateRange.from || dateRange.to) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.1 }}
              >
                <Badge 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {dateRange.from && format(dateRange.from, "d/M", { locale: ar })}
                  {dateRange.to && ` - ${format(dateRange.to, "d/M", { locale: ar })}`}
                  <X className="w-3.5 h-3.5 hover:text-destructive transition-colors" />
                </Badge>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-4 rounded-xl font-medium"
              >
                <X className="w-4 h-4 ml-2" />
                مسح الكل
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Date Filters with Enhanced Design */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-3 font-medium">فلاتر سريعة:</p>
              <div className="flex gap-3 flex-wrap">
                {quickDateFilters.map((filter, index) => (
                  <motion.div
                    key={filter.days}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-xl px-4 py-2 h-auto",
                        "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
                        "transition-all duration-300"
                      )}
                      onClick={() => {
                        const now = new Date();
                        const from = new Date();
                        from.setDate(now.getDate() - filter.days);
                        setDateRange({ from: filter.days === 0 ? now : from, to: now });
                      }}
                    >
                      {filter.icon && <filter.icon className="w-4 h-4 ml-2" />}
                      {filter.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModernOrdersSearch;
