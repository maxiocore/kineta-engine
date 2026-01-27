/**
 * MaxioCore Financing Admin V2 - Filters Bar
 * شريط الفلترة للوحة الأدمن
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, RefreshCw } from 'lucide-react';
import type { AdminFilters } from '../types';
import type { FinancingStatus } from '../../types';
import { STATUS_CONFIG } from '../../config/statusConfig';
import { cn } from '@/lib/utils';

interface AdminFiltersBarProps {
  filters: AdminFilters;
  onFilterChange: (filters: Partial<AdminFilters>) => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

// Quick filter tabs
const QUICK_FILTERS: Array<{ value: FinancingStatus | 'all'; label: string; color?: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'SUBMITTED', label: 'جديد', color: 'bg-blue-500' },
  { value: 'UNDER_REVIEW', label: 'قيد المراجعة', color: 'bg-yellow-500' },
  { value: 'OFFER_READY', label: 'العرض جاهز', color: 'bg-green-500' },
  { value: 'ACK_PENDING', label: 'بانتظار الإقرار', color: 'bg-orange-500' },
  { value: 'CONTRACT_PENDING', label: 'بانتظار العقد', color: 'bg-purple-500' },
  { value: 'CREDIT_ACTIVE', label: 'نشط', color: 'bg-emerald-500' },
];

export function AdminFiltersBar({
  filters,
  onFilterChange,
  onReset,
  onRefresh,
  isLoading,
}: AdminFiltersBarProps) {
  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.search || 
    filters.dateFrom || 
    filters.dateTo;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search and Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، رقم الطلب، الجوال، الهوية..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pr-10"
          />
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange({ sortBy: value as AdminFilters['sortBy'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="submitted_at">تاريخ التقديم</SelectItem>
            <SelectItem value="updated_at">آخر تحديث</SelectItem>
            <SelectItem value="requested_amount">المبلغ المطلوب</SelectItem>
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 ml-1" />
              مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={filters.status === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ status: filter.value })}
            className={cn(
              "transition-all",
              filters.status === filter.value && "shadow-md"
            )}
          >
            {filter.color && (
              <span 
                className={cn("w-2 h-2 rounded-full ml-2", filter.color)} 
              />
            )}
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
