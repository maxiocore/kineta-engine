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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="card-elevated border-border/30 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رصيدك الحالي</p>
                <motion.p 
                  className="text-2xl sm:text-3xl font-bold"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {balance.toFixed(2)} <span className="text-lg font-normal text-muted-foreground">ر.س</span>
                </motion.p>
              </div>
            </div>
            <Button 
              onClick={handleDeposit}
              className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              شحن الرصيد
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الإيداعات</p>
                <p className="font-semibold text-sm">{totalDeposited.toFixed(2)} ر.س</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
                <p className="font-semibold text-sm">{totalSpent.toFixed(2)} ر.س</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BalanceSummary;
