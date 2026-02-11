import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Bell, 
  Volume2, 
  VolumeX, 
  BarChart3, 
  RefreshCw, 
  Download, 
  ArrowUpDown,
  ChevronDown,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OrdersHeaderProps {
  newOrdersCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
  syncing: boolean;
  onSync: () => void;
  onExport: (type: 'csv' | 'json') => void;
}

const OrdersHeader = ({
  newOrdersCount,
  soundEnabled,
  onToggleSound,
  showAnalytics,
  onToggleAnalytics,
  syncing,
  onSync,
  onExport,
}: OrdersHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 lg:p-6"
      dir="rtl"
    >
      {/* Background Elements */}
      <div className="absolute top-0 start-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 end-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="relative flex flex-col lg:flex-row-reverse lg:items-center lg:justify-between gap-4">
        {/* Title Section */}
        <div className="flex items-center gap-4 flex-row-reverse">
          <motion.div 
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <ShoppingBag className="w-6 h-6 lg:w-7 lg:h-7 text-primary-foreground" />
          </motion.div>
          <div className="text-right">
            <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-3 flex-row-reverse">
              إدارة الطلبات
              {newOrdersCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Badge className="bg-destructive text-destructive-foreground animate-pulse text-xs px-2 flex items-center gap-1 flex-row-reverse">
                    <Bell className="w-3 h-3" />
                    {newOrdersCount} جديد
                  </Badge>
                </motion.div>
              )}
            </h1>
            <p className="text-muted-foreground text-xs lg:text-sm mt-0.5">متابعة وإدارة جميع الطلبات</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 flex-row-reverse">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleSound}
                className="h-9 w-9"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{soundEnabled ? "إيقاف الصوت" : "تفعيل الصوت"}</TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAnalytics}
            className={cn("gap-2 h-9 flex-row-reverse", showAnalytics && "bg-primary/10")}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">التحليلات</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={syncing}
            className="gap-2 h-9 flex-row-reverse"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            <span className="hidden sm:inline">{syncing ? "مزامنة..." : "تحديث"}</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 flex-row-reverse">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">تصدير</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('csv')} className="gap-2 flex-row-reverse">
                <FileText className="w-4 h-4" />
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('json')} className="gap-2 flex-row-reverse">
                <FileText className="w-4 h-4" />
                تصدير JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          
        </div>
      </div>
    </motion.div>
  );
};

export default OrdersHeader;
