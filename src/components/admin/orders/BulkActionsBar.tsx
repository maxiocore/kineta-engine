import { motion, AnimatePresence } from "framer-motion";
import { Package, CheckCircle, Download, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusUpdate: (status: string) => void;
  onExport: (type: 'csv' | 'json') => void;
  onDelete: () => void;
  onClear: () => void;
  statusOptions: Array<{ value: string; label: string; icon: any }>;
}

const BulkActionsBar = ({
  selectedCount,
  onStatusUpdate,
  onExport,
  onDelete,
  onClear,
  statusOptions,
}: BulkActionsBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-l from-primary/10 to-primary/5 rounded-xl border border-primary/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium">تم تحديد {selectedCount} طلب</span>
          </div>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-lg h-8 text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  تحديث الحالة
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {statusOptions.map(opt => (
                  <DropdownMenuItem key={opt.value} onClick={() => onStatusUpdate(opt.value)} className="gap-2 text-xs">
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-lg h-8 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  تصدير
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onExport('csv')} className="text-xs">
                  تصدير CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('json')} className="text-xs">
                  تصدير JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" variant="destructive" onClick={onDelete} className="gap-1.5 rounded-lg h-8 text-xs">
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </Button>
            <Button size="sm" variant="ghost" onClick={onClear} className="rounded-lg h-8 text-xs">
              إلغاء
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionsBar;
