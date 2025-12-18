import { motion } from "framer-motion";
import { Search, Grid3X3, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ServiceFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  categories: string[];
  statusOptions: { value: string; label: string }[];
  serviceCounts: { category: string; count: number }[];
  totalCount?: number;
}

const ServiceFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  categories,
  statusOptions,
  serviceCounts,
  totalCount = 0,
}: ServiceFiltersProps) => {
  const getCountForCategory = (category: string) => {
    const found = serviceCounts.find(c => c.category === category);
    return found?.count || 0;
  };

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-none h-10 w-10",
                viewMode === "list" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-none h-10 w-10",
                viewMode === "grid" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Status Select */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-28 bg-secondary/50 rounded-xl h-10">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الخدمات..."
              className="pr-10 bg-secondary/50 rounded-xl h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All Tab */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            الكل
            <span className={cn(
              "text-xs font-bold",
              selectedCategory === "all" ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {totalCount}
            </span>
          </motion.button>

          {/* Category Tabs */}
          {categories.map((category) => {
            const count = getCountForCategory(category);
            const isSelected = selectedCategory === category;
            
            return (
              <motion.button
                key={category}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {category}
                <span className={cn(
                  "text-xs font-bold",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceFilters;
