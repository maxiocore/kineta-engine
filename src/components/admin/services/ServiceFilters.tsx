import { motion } from "framer-motion";
import { Search, Grid3X3, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
      <CardContent className="p-3 space-y-3">
        {/* Row 1: Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الخدمات..."
            className="pr-10 bg-secondary/50 rounded-lg h-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Row 2: View Toggle + Status */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-none h-8 w-8",
                viewMode === "list" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-none h-8 w-8",
                viewMode === "grid" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </Button>
          </div>
          
          {/* Status Select */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="flex-1 bg-secondary/50 rounded-lg h-8 text-xs">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">جميع الحالات</SelectItem>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Row 3: Category Tabs - Horizontal Scrollable */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex items-center gap-1.5 pb-2">
            {/* All Tab */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 shrink-0",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              الكل
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
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
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {category}
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
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
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ServiceFilters;
