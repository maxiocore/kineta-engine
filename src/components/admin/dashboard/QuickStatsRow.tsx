import { motion } from "framer-motion";
import { Wallet, CreditCard, TicketCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStat {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
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
      value: `${totalBalance.toLocaleString()} ر.س`,
      icon: Wallet,
      color: "text-primary bg-primary/10",
    },
    {
      label: "إجمالي الإيداعات",
      value: `${totalDeposits.toLocaleString()} ر.س`,
      icon: CreditCard,
      color: "text-success bg-success/10",
    },
    {
      label: "تذاكر مفتوحة",
      value: openTickets,
      icon: TicketCheck,
      color: "text-warning bg-warning/10",
    },
    {
      label: "رسائل جديدة",
      value: pendingMessages,
      icon: MessageSquare,
      color: "text-accent bg-accent/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * index }}
          className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-card/50 border border-border/30 hover:border-border/50 transition-colors"
        >
          <div className={cn("p-2 rounded-lg", stat.color)}>
            <stat.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold truncate">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuickStatsRow;
