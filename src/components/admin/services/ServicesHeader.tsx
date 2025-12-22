import { Package, Plus, RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServicesHeaderProps {
  onAddNew: () => void;
  onBulkDelete: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  servicesCount: number;
}

const ServicesHeader = ({ 
  onAddNew, 
  onRefresh, 
  refreshing,
  servicesCount 
}: ServicesHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      {/* Title Section */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
          <Package className="w-4.5 h-4.5 md:w-5 md:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold text-foreground leading-tight">الخدمات</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground">{servicesCount} خدمة</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button 
          onClick={onAddNew}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 h-8 md:h-9 px-3 md:px-4 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">إضافة</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-8 w-8 md:h-9 md:w-9 border-border/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          className="h-8 w-8 md:h-9 md:w-9 border-border/50"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ServicesHeader;
