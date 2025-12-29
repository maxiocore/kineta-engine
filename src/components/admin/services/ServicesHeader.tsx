import { motion } from "framer-motion";
import { Package, Plus, RefreshCw, Trash2 } from "lucide-react";
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
  onBulkDelete,
  onRefresh, 
  refreshing,
  servicesCount 
}: ServicesHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-3 flex-row-reverse"
      dir="rtl"
    >
      {/* Title Section */}
      <div className="flex items-center gap-3 flex-row-reverse">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="text-right">
          <h1 className="text-lg sm:text-xl font-bold text-foreground">إدارة الخدمات</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{servicesCount} خدمة متاحة</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-row-reverse">
        <Button 
          onClick={onAddNew}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md h-9 px-3 sm:px-4 text-xs sm:text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">إضافة خدمة</span>
          <span className="xs:hidden">إضافة</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-9 w-9 border-border/50 hover:bg-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={onBulkDelete}
          className="h-9 w-9 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ServicesHeader;