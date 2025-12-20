import { motion } from "framer-motion";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BalanceSummaryProps {
  balance: number;
  totalDeposited: number;
  totalSpent: number;
}

const BalanceSummary = ({ balance, totalDeposited, totalSpent }: BalanceSummaryProps) => {
  const navigate = useNavigate();

  const handleDeposit = () => {
    navigate("/dashboard/deposit");
  };

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="card-elevated border-border/30 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-row-reverse items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">رصيدك الحالي</p>
                <motion.p 
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {balance.toFixed(2)} <span className="text-xs sm:text-sm md:text-lg font-normal text-muted-foreground">ر.س</span>
                </motion.p>
              </div>
            </div>
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/dashboard/deposit");
              }}
              className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 text-xs sm:text-sm cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">شحن الرصيد</span>
              <span className="sm:hidden">شحن</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/30">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">إجمالي الإيداعات</p>
                <p className="font-semibold text-[11px] sm:text-xs md:text-sm truncate">{totalDeposited.toFixed(2)} ر.س</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">إجمالي المصروفات</p>
                <p className="font-semibold text-[11px] sm:text-xs md:text-sm truncate">{totalSpent.toFixed(2)} ر.س</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BalanceSummary;
