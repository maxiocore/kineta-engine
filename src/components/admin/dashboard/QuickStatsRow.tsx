import { motion } from "framer-motion";
import { Wallet, CreditCard, TicketCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStat {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
}

interface QuickStatsRowProps {
  totalBalance: number;
  totalDeposits: number;
  openTickets: number;
  pendingMessages: number;
}

const QuickStatsRow = ({
  totalBalance,
  totalDeposits,
  openTickets,
  pendingMessages,
}: QuickStatsRowProps) => {
  const stats: QuickStat[] = [
    {
      label: "رصيد المستخدمين",
      value: `${totalBalance.toLocaleString('ar-SA')} ر.س`,
      icon: Wallet,
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
    },
    {
      label: "إجمالي الإيداعات",
      value: `${totalDeposits.toLocaleString('ar-SA')} ر.س`,
      icon: CreditCard,
      color: "text-success",
      bgGradient: "from-success/20 to-success/5",
    },
    {
      label: "تذاكر الدعم المفتوحة",
      value: openTickets.toLocaleString('ar-SA'),
      icon: TicketCheck,
      color: "text-warning",
      bgGradient: "from-warning/20 to-warning/5",
    },
    {
      label: "رسائل جديدة",
      value: pendingMessages.toLocaleString('ar-SA'),
      icon: MessageSquare,
      color: "text-accent",
      bgGradient: "from-accent/20 to-accent/5",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
      dir="rtl"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.02, y: -2 }}
          className={cn(
            "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl",
            "bg-gradient-to-l border border-border/30 hover:border-border/50",
            "transition-all duration-300 cursor-pointer group",
            stat.bgGradient
          )}
        >
          <div className={cn(
            "p-2 rounded-lg bg-background/50 group-hover:scale-110 transition-transform",
            stat.color
          )}>
            <stat.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-xs sm:text-sm font-bold truncate">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuickStatsRow;
