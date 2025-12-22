import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, RefreshCw, Download, Calendar, X, 
  SlidersHorizontal, Clock
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
];

const quickDateFilters = [
  { label: "اليوم", days: 0 },
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
      className="space-y-3"
      dir="rtl"
    >
      {/* Search Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="البحث برقم الطلب أو اسم الخدمة..."
            className="h-12 pr-12 pl-10 bg-card/80 backdrop-blur-sm border-border/50 rounded-xl transition-all focus:ring-2 focus:ring-primary/20"
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
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl bg-card/80 border-border/50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="الحالة" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", option.dot)} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-12 px-4 rounded-xl border-border/50 bg-card/80 gap-2",
                (dateRange.from || dateRange.to) && "border-primary/50 bg-primary/5"
              )}
            >
              <Calendar className="w-4 h-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <span className="text-sm">
                    {format(dateRange.from, "d MMM", { locale: ar })} - {format(dateRange.to, "d MMM", { locale: ar })}
                  </span>
                ) : (
                  format(dateRange.from, "d MMM yyyy", { locale: ar })
                )
              ) : (
                "التاريخ"
              )}
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

        {/* Quick Filters Toggle */}
        <Button
          variant="outline"
          className={cn(
            "h-12 px-4 rounded-xl border-border/50 gap-2",
            showAdvanced && "bg-primary/10 border-primary/50"
          )}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">متقدم</span>
        </Button>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={onExport}
              className="h-12 w-12 rounded-xl border-border/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500"
            >
              <Download className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <Badge variant="secondary" className="px-3 py-1">
              {filteredCount} من {totalCount} طلب
            </Badge>

            {statusFilter !== "all" && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1">
                {statusOptions.find(s => s.value === statusFilter)?.label}
                <button onClick={() => setStatusFilter("all")}>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              </Badge>
            )}

            {(dateRange.from || dateRange.to) && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1">
                <Clock className="w-3 h-3" />
                {dateRange.from && format(dateRange.from, "d/M", { locale: ar })}
                {dateRange.to && ` - ${format(dateRange.to, "d/M", { locale: ar })}`}
                <button onClick={() => setDateRange({ from: undefined, to: undefined })}>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-3 rounded-lg"
            >
              مسح الكل
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Date Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-border/50 flex gap-2 flex-wrap">
              {quickDateFilters.map((filter, index) => (
                <motion.div
                  key={filter.days}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg hover:bg-primary/10 hover:border-primary/50"
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
    </motion.div>
  );
};

export default ModernOrdersSearch;
