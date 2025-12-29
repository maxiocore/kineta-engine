import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Clock, 
  Activity, 
  CheckCircle, 
  XCircle,
  CalendarDays
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface OrderStats {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

interface Service {
  id: string;
  name: string;
}

interface OrdersFiltersProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (service: string) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (date: Date | undefined) => void;
  sortBy: "date" | "price";
  sortOrder: "asc" | "desc";
  onSortChange: (by: "date" | "price", order: "asc" | "desc") => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  activeFiltersCount: number;
  onResetFilters: () => void;
  stats: OrderStats;
  services: Service[];
  statusOptions: Array<{ value: string; label: string; icon: any }>;
}

const OrdersFilters = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  serviceFilter,
  onServiceFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortBy,
  sortOrder,
  onSortChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  activeFiltersCount,
  onResetFilters,
  stats,
  services,
  statusOptions,
}: OrdersFiltersProps) => {
  return (
    <div className="space-y-3 sm:space-y-4" dir="rtl">
      {/* Quick Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          <TabsList className="w-max sm:w-full justify-start bg-secondary/40 p-1 h-auto flex gap-1 rounded-xl flex-row-reverse">
            <TabsTrigger value="all" className="text-[10px] sm:text-xs data-[state=active]:bg-background rounded-lg px-2 sm:px-3 py-1.5 whitespace-nowrap">
              الكل
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-[10px] sm:text-xs data-[state=active]:bg-background rounded-lg px-2 sm:px-3 py-1.5 gap-1 whitespace-nowrap flex-row-reverse">
              <Clock className="w-3 h-3" />
              انتظار ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-[10px] sm:text-xs data-[state=active]:bg-background rounded-lg px-2 sm:px-3 py-1.5 gap-1 whitespace-nowrap flex-row-reverse">
              <Activity className="w-3 h-3" />
              تنفيذ ({stats.in_progress})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-[10px] sm:text-xs data-[state=active]:bg-background rounded-lg px-2 sm:px-3 py-1.5 gap-1 whitespace-nowrap flex-row-reverse">
              <CheckCircle className="w-3 h-3" />
              مكتمل
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-[10px] sm:text-xs data-[state=active]:bg-background rounded-lg px-2 sm:px-3 py-1.5 gap-1 whitespace-nowrap flex-row-reverse">
              <XCircle className="w-3 h-3" />
              ملغي ({stats.cancelled})
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Search & Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="البحث برقم الطلب، العميل..." 
            className="pr-10 bg-secondary/40 border-border/50 h-10 rounded-xl text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            onClick={onToggleAdvancedFilters}
            size="sm"
            className="gap-1.5 h-10 rounded-xl text-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            فلاتر
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] h-4 w-4 p-0 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          <Select 
            value={`${sortBy}-${sortOrder}`} 
            onValueChange={(v) => {
              const [by, order] = v.split("-");
              onSortChange(by as "date" | "price", order as "asc" | "desc");
            }}
          >
            <SelectTrigger className="w-[120px] sm:w-[140px] h-10 bg-secondary/40 rounded-xl text-xs">
              <SelectValue placeholder="ترتيب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">الأحدث أولاً</SelectItem>
              <SelectItem value="date-asc">الأقدم أولاً</SelectItem>
              <SelectItem value="price-desc">الأعلى سعراً</SelectItem>
              <SelectItem value="price-asc">الأقل سعراً</SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="icon" onClick={onResetFilters} className="h-10 w-10 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/40">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">الحالة</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="bg-secondary/40 h-9 rounded-lg text-xs">
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-3 h-3" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">الخدمة</Label>
                <Select value={serviceFilter} onValueChange={onServiceFilterChange}>
                  <SelectTrigger className="bg-secondary/40 h-9 rounded-lg text-xs">
                    <SelectValue placeholder="جميع الخدمات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الخدمات</SelectItem>
                    {services.slice(0, 20).map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">من تاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full justify-start h-9 bg-secondary/40 gap-2 rounded-lg text-xs",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {dateFrom ? format(dateFrom, "d MMM", { locale: ar }) : "اختر"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={onDateFromChange} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">إلى تاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full justify-start h-9 bg-secondary/40 gap-2 rounded-lg text-xs",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {dateTo ? format(dateTo, "d MMM", { locale: ar }) : "اختر"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={onDateToChange} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersFilters;
