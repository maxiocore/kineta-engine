import { motion } from "framer-motion";
import { Package, Plus, RefreshCw, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
      className="relative overflow-hidden rounded-xl bg-gradient-to-l from-primary via-primary/90 to-accent p-3 md:p-5"
    >
      {/* Background decorations - simplified for mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Title Section */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm p-2 md:p-2.5 shadow-lg shrink-0">
            <Package className="w-full h-full text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold text-white">إدارة الخدمات</h1>
            <p className="text-white/70 text-[10px] md:text-xs">
              {servicesCount} خدمة متاحة
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button 
            onClick={onAddNew}
            size="sm"
            className="bg-white text-primary hover:bg-white/90 shadow-md text-xs h-8 px-2.5 md:px-3 gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">إضافة</span>
          </Button>
          
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-0.5">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBulkDelete}
              className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Link to="/admin/services/prices">
              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20">
                <DollarSign className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServicesHeader;
