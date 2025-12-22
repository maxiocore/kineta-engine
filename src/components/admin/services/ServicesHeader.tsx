import { motion } from "framer-motion";
import { Package, Plus, RefreshCw, Download, DollarSign, Trash2 } from "lucide-react";
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-l from-primary via-primary/90 to-accent p-4 sm:p-6"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-40 sm:w-60 h-40 sm:h-60 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 sm:w-32 h-24 sm:h-32 bg-accent/20 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm p-2.5 sm:p-3 shadow-lg shrink-0"
          >
            <Package className="w-full h-full text-white" />
          </motion.div>
          <div className="min-w-0">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-2xl font-bold text-white truncate"
            >
              إدارة الخدمات
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/70 text-xs sm:text-sm mt-0.5 sm:mt-1"
            >
              {servicesCount} خدمة متاحة
            </motion.p>
          </div>
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2"
        >
          <Button 
            onClick={onAddNew}
            size="sm"
            className="bg-white text-primary hover:bg-white/90 gap-1.5 sm:gap-2 shadow-lg text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">إضافة</span>
            <span className="xs:hidden">+</span>
          </Button>
          
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-0.5 sm:p-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBulkDelete}
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Link to="/admin/services/prices">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </Link>
            <Link to="/admin/services/import" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20">
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ServicesHeader;
