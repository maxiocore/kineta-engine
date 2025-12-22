import { motion } from "framer-motion";
import { Package, Plus, RefreshCw, Download, DollarSign, Trash2, Settings2 } from "lucide-react";
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
      className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary via-primary/90 to-accent p-6"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title Section */}
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm p-3 shadow-lg"
          >
            <Package className="w-full h-full text-white" />
          </motion.div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white"
            >
              إدارة الخدمات
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/70 text-sm mt-1"
            >
              {servicesCount} خدمة متاحة • إضافة وتعديل الخدمات
            </motion.p>
          </div>
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button 
            onClick={onAddNew}
            className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            إضافة خدمة
          </Button>
          
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl p-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBulkDelete}
              className="h-9 w-9 text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Link to="/admin/services/prices">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20">
                <DollarSign className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/services/import">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20">
                <Download className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className="h-9 w-9 text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ServicesHeader;
