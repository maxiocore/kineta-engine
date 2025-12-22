import { motion, AnimatePresence } from "framer-motion";
import { Search, Grid3X3, List, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
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
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  statusOptions,
  totalCount,
  filteredCount,
  priceRange,
  setPriceRange,
  maxPrice,
  sortBy,
  setSortBy,
}: EnhancedServiceFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = Boolean(searchQuery) || selectedCategory !== "all" || selectedStatus !== "all" || 
    priceRange[0] > 0 || priceRange[1] < maxPrice;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setPriceRange([0, maxPrice]);
    setSortBy("newest");
  };

  const sortOptions = [
    { value: "newest", label: "الأحدث" },
    { value: "oldest", label: "الأقدم" },
    { value: "price-high", label: "الأعلى سعراً" },
    { value: "price-low", label: "الأقل سعراً" },
    { value: "orders", label: "الأكثر طلباً" },
    { value: "revenue", label: "الأعلى إيراداً" },
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Top Row: Search + Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث..."
              className="pr-10 bg-secondary/50 rounded-xl h-11 text-sm border-0 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-border bg-secondary/30 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-lg h-9 w-9 transition-all",
                viewMode === "grid" && "bg-primary text-primary-foreground shadow-sm"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-lg h-9 w-9 transition-all",
                viewMode === "list" && "bg-primary text-primary-foreground shadow-sm"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant={showAdvanced ? "default" : "outline"}
            size="sm"
            className="gap-2 h-11 px-4"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">فلاتر</span>
            {hasActiveFilters && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                !
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/50 space-y-4">
                {/* Filter Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Status */}
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-secondary/50 rounded-xl h-10 text-sm">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-secondary/50 rounded-xl h-10 text-sm">
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Price Range */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-between bg-secondary/50 rounded-xl h-10 border-0 text-sm">
                        <span>
                          ${priceRange[0]} - ${priceRange[1]}
                        </span>
                        <ChevronDown className="w-4 h-4 mr-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>نطاق السعر</span>
                          <span className="text-muted-foreground">
                            ${priceRange[0]} - ${priceRange[1]}
                          </span>
                        </div>
                        <Slider
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          max={maxPrice}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 text-sm"
                      onClick={clearAllFilters}
                    >
                      <X className="w-4 h-4 ml-1" />
                      مسح الفلاتر
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground">{filteredCount}</span>
              {" من "}
              <span className="font-bold text-foreground">{totalCount}</span>
              {" خدمة"}
            </span>
          </div>
          
          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  بحث: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {selectedStatus !== "all" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {statusOptions.find(s => s.value === selectedStatus)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedStatus("all")} />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedServiceFilters;
