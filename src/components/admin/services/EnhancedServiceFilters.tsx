import { motion, AnimatePresence } from "framer-motion";
import { Search, Grid3X3, List, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EnhancedServiceFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  statusOptions: { value: string; label: string }[];
  totalCount: number;
  filteredCount: number;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  maxPrice: number;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const EnhancedServiceFilters = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  statusOptions,
  totalCount,
  filteredCount,
  sortBy,
  setSortBy,
}: EnhancedServiceFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { value: "newest", label: "الأحدث" },
    { value: "oldest", label: "الأقدم" },
    { value: "price-high", label: "الأعلى سعراً" },
    { value: "price-low", label: "الأقل سعراً" },
    { value: "orders", label: "الأكثر طلباً" },
    { value: "revenue", label: "الأعلى إيراداً" },
  ];

  const hasActiveFilters = selectedStatus !== "all" || sortBy !== "newest";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Main Filter Row */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث عن خدمة..."
            className="w-full pr-10 h-10 text-sm bg-card border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-secondary"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl border border-border/50 bg-card p-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg transition-all",
              viewMode === "grid" && "bg-primary text-primary-foreground shadow-sm"
            )}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg transition-all",
              viewMode === "list" && "bg-primary text-primary-foreground shadow-sm"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-10 px-3 rounded-xl border-border/50 gap-2 shrink-0",
            showFilters && "bg-primary text-primary-foreground border-primary"
          )}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">الفلاتر</span>
          {hasActiveFilters && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent">
              2
            </Badge>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showFilters && "rotate-180")} />
        </Button>

        {/* Results Count */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <span className="font-semibold text-foreground">{filteredCount}</span>
          <span>من</span>
          <span>{totalCount}</span>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 pb-2 min-w-max sm:min-w-0 sm:flex-wrap">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px] h-9 text-xs bg-card border-border/50 rounded-xl">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border/50 rounded-xl">
                    <SelectValue placeholder="الترتيب" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setSelectedStatus("all");
                      setSortBy("newest");
                    }}
                  >
                    <X className="w-3.5 h-3.5 ml-1" />
                    مسح الفلاتر
                  </Button>
                )}

                {/* Mobile Results Count */}
                <div className="flex sm:hidden items-center gap-1 text-xs text-muted-foreground mr-auto">
                  <span className="font-semibold text-foreground">{filteredCount}</span>
                  <span>/</span>
                  <span>{totalCount}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedServiceFilters;