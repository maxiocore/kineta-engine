import { useState } from 'react';
import { 
  Search, 
  Filter, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TicketCategory } from '@/hooks/useSupportSystem';
import { cn } from '@/lib/utils';

interface TicketFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  categories: TicketCategory[];
  showAdvanced?: boolean;
}

export const TicketFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  categories,
  showAdvanced = true,
}: TicketFiltersProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const hasActiveFilters = priorityFilter !== 'all' || categoryFilter !== 'all';
  const activeFilterCount = [priorityFilter, categoryFilter].filter(f => f !== 'all').length;

  const clearFilters = () => {
    onPriorityChange('all');
    onCategoryChange('all');
  };

  return (
    <div className="space-y-4">
      {/* Search and status tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث في التذاكر..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ps-10 bg-secondary/50 border-border/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
                فلاتر
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ms-1 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">الفلاتر المتقدمة</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      مسح الكل
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">الأولوية</label>
                  <Select value={priorityFilter} onValueChange={onPriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأولويات</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {categories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">التصنيف</label>
                    <Select value={categoryFilter} onValueChange={onCategoryChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع التصنيفات</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={onStatusChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="gap-1.5">
            الكل
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            مفتوحة
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            قيد المعالجة
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            تم الحل
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            مغلقة
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {priorityFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              الأولوية: {
                { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' }[priorityFilter]
              }
              <button onClick={() => onPriorityChange('all')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              التصنيف: {categories.find(c => c.id === categoryFilter)?.name_ar}
              <button onClick={() => onCategoryChange('all')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
