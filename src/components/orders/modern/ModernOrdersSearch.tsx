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
      className="space-y-3 md:space-y-4 relative"
      dir="rtl"
    >
      {/* Main Search Row */}
      <div className="flex flex-col gap-2 md:gap-3 relative">
        {/* Search Input - Full Width on Mobile */}
        <motion.div 
          className={cn(
            "relative group",
            isFocused && "z-10"
          )}
          animate={{ scale: isFocused ? 1.005 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={cn(
            "absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-l from-primary/15 to-accent/15 opacity-0 blur transition-opacity duration-300",
            isFocused && "opacity-100"
          )} />
          
          <div className="relative">
            <motion.div
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2"
              animate={{ rotate: isFocused ? [0, -8, 8, 0] : 0 }}
              transition={{ duration: 0.4 }}
            >
              <Search className={cn(
                "w-4 h-4 md:w-5 md:h-5 transition-colors duration-300",
                isFocused ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.div>
            
            <Input
              placeholder="البحث برقم الطلب أو اسم الخدمة..."
              className={cn(
                "h-11 md:h-14 pr-10 md:pr-14 pl-10 md:pl-12 bg-card/90 backdrop-blur-sm border-border/50 rounded-lg md:rounded-xl text-sm md:text-base",
                "transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                "placeholder:text-muted-foreground/70 placeholder:text-xs md:placeholder:text-sm"
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
                  className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Filters Row - Grid on Mobile */}
        <div className="grid grid-cols-2 sm:flex gap-2 md:gap-3">

          {/* Status Filter */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="col-span-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(
                "w-full h-11 md:h-12 rounded-lg md:rounded-xl bg-card/90 backdrop-blur-sm border-border/50 text-xs md:text-sm",
                "hover:border-primary/50 transition-all duration-300",
                statusFilter !== "all" && "border-primary/50 bg-primary/5"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center",
                    statusFilter !== "all" ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Filter className={cn(
                      "w-3 h-3 md:w-3.5 md:h-3.5",
                      statusFilter !== "all" ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <SelectValue placeholder="الحالة" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-lg md:rounded-xl">
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="rounded-md md:rounded-lg text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <motion.span 
                        className={cn("w-2 h-2 rounded-full", option.dot)}
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

          {/* Date Range */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="col-span-1">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl border-border/50 bg-card/90 backdrop-blur-sm gap-2 text-xs md:text-sm justify-start",
                    "hover:border-primary/50 transition-all duration-300",
                    (dateRange.from || dateRange.to) && "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                    (dateRange.from || dateRange.to) ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Calendar className={cn(
                      "w-3 h-3 md:w-3.5 md:h-3.5",
                      (dateRange.from || dateRange.to) ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  {dateRange.from ? (
                    dateRange.to ? (
                      <span className="text-xs md:text-sm font-medium truncate">
                        {format(dateRange.from, "d MMM", { locale: ar })} - {format(dateRange.to, "d MMM", { locale: ar })}
                      </span>
                    ) : (
                      <span className="truncate">{format(dateRange.from, "d MMM", { locale: ar })}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">التاريخ</span>
                  )}
                </Button>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl md:rounded-2xl overflow-hidden" align="end">
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
                <div className="p-2 md:p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-lg md:rounded-xl hover:bg-destructive/10 hover:text-destructive text-xs md:text-sm"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setCalendarOpen(false);
                    }}
                  >
                    <X className="w-3.5 h-3.5 ml-1.5" />
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
              "h-11 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl border-border/50 gap-2 text-xs md:text-sm col-span-1 sm:col-auto",
              "transition-all duration-300",
              showAdvanced && "bg-gradient-to-l from-primary/15 to-accent/15 border-primary/50"
            )}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </motion.div>
            <span className="hidden sm:inline font-medium">خيارات متقدمة</span>
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2 col-span-1 sm:col-auto">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 180 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex-1 sm:flex-initial"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className={cn(
                  "h-11 w-full sm:h-12 sm:w-12 rounded-lg md:rounded-xl border-border/50",
                  "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
                  "transition-all duration-300"
                )}
              >
                <RefreshCw className={cn("w-4 h-4 md:w-5 md:h-5", isRefreshing && "animate-spin")} />
              </Button>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="flex-1 sm:flex-initial"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={onExport}
                className={cn(
                  "h-11 w-full sm:h-12 sm:w-12 rounded-lg md:rounded-xl border-border/50",
                  "hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500",
                  "transition-all duration-300"
                )}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Active Filters with Enhanced Design */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Badge 
                variant="secondary" 
                className="px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                <ArrowDownToDot className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
                {filteredCount} من {totalCount} طلب
              </Badge>
            </motion.div>

            {statusFilter !== "all" && (
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
              >
                <Badge 
                  variant="outline" 
                  className="gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-medium hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={() => setStatusFilter("all")}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    statusOptions.find(s => s.value === statusFilter)?.dot
                  )} />
                  {statusOptions.find(s => s.value === statusFilter)?.label}
                  <X className="w-3 h-3 hover:text-destructive transition-colors" />
                </Badge>
              </motion.div>
            )}

            {(dateRange.from || dateRange.to) && (
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ delay: 0.05 }}
              >
                <Badge 
                  variant="outline" 
                  className="gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-medium hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  <Clock className="w-3 h-3" />
                  {dateRange.from && format(dateRange.from, "d/M", { locale: ar })}
                  {dateRange.to && ` - ${format(dateRange.to, "d/M", { locale: ar })}`}
                  <X className="w-3 h-3 hover:text-destructive transition-colors" />
                </Badge>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 md:h-8 px-2 md:px-3 rounded-lg font-medium text-[10px] md:text-xs"
              >
                <X className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
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
