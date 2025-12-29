import React from "react";
import { motion } from "framer-motion";
import { 
  ShoppingBag, Bell, BellOff, RefreshCw, Download, 
  FileJson, FileSpreadsheet, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AdminOrdersHeaderProps {
  newOrdersCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  syncing: boolean;
  onSync: () => void;
  onExport: (type: 'csv' | 'json') => void;
}

export const AdminOrdersHeader = ({
  newOrdersCount,
  soundEnabled,
  onToggleSound,
  syncing,
  onSync,
  onExport,
}: AdminOrdersHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 border border-primary/20"
      dir="rtl"
    >
      {/* Background Effects */}
      <div className="absolute top-0 end-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 start-1/2 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-row-reverse items-center gap-4">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            {newOrdersCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -start-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-lg"
              >
                {newOrdersCount}
              </motion.div>
            )}
          </motion.div>
          
          <div className="flex flex-col text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">إدارة الطلبات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              مراقبة وإدارة جميع طلبات العملاء
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row-reverse items-center gap-2 flex-wrap">
          {/* Sound Toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSound}
              className={cn(
                "h-10 w-10 rounded-xl border-border/50",
                soundEnabled && "bg-primary/10 border-primary/50 text-primary"
              )}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          </motion.div>

          {/* Sync Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={onSync}
              disabled={syncing}
              className="h-10 px-4 rounded-xl border-border/50 gap-2 flex flex-row-reverse"
            >
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              <span className="hidden sm:inline">مزامنة</span>
            </Button>
          </motion.div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="h-10 px-4 rounded-xl border-border/50 gap-2 flex flex-row-reverse"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">تصدير</span>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl">
              <DropdownMenuItem onClick={() => onExport('csv')} className="gap-2 cursor-pointer flex flex-row-reverse">
                <FileSpreadsheet className="w-4 h-4" />
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('json')} className="gap-2 cursor-pointer flex flex-row-reverse">
                <FileJson className="w-4 h-4" />
                تصدير JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Orders Badge */}
      {newOrdersCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mt-4"
        >
          <Badge className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {newOrdersCount} طلب جديد
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminOrdersHeader;
