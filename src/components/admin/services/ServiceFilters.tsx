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

        {/* Category Tabs - Horizontal Scrollable */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {/* All Tab */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            الكل
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              selectedCategory === "all" 
                ? "bg-primary-foreground/20 text-primary-foreground" 
                : "bg-background/50 text-muted-foreground"
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
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {category}
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  isSelected 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-background/50 text-muted-foreground"
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
