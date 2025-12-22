import { Search, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ];

  return (
    <div className="w-full space-y-2">
      {/* Search Row */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث عن خدمة..."
            className="w-full pr-9 h-9 text-sm bg-secondary/30 border-border/50 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-border/50 bg-secondary/30 p-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-md",
              viewMode === "grid" && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-md",
              viewMode === "list" && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters Toggle */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 border-border/50 shrink-0",
            showFilters && "bg-primary text-primary-foreground border-primary"
          )}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters Row - horizontally scrollable on mobile */}
      {showFilters && (
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max pb-1">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-secondary/30 border-border/50">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary/30 border-border/50">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span className="text-xs text-muted-foreground whitespace-nowrap px-2">
              {filteredCount} / {totalCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedServiceFilters;