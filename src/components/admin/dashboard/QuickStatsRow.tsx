import { motion } from "framer-motion";
import { Wallet, CreditCard, TicketCheck, MessageSquare, TrendingUp, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QuickStat {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  route?: string;
  trend?: number;
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
  const navigate = useNavigate();

  const stats: QuickStat[] = [
    {
      label: "رصيد المستخدمين",
      value: `${totalBalance.toLocaleString('ar-SA')} ر.س`,
      icon: Wallet,
      color: "text-primary",
      bgGradient: "from-primary/20 via-primary/10 to-primary/5",
      route: "/admin/wallets",
      trend: 12,
    },
    {
      label: "إجمالي الإيداعات",
      value: `${totalDeposits.toLocaleString('ar-SA')} ر.س`,
      icon: CreditCard,
      color: "text-success",
      bgGradient: "from-success/20 via-success/10 to-success/5",
      route: "/admin/wallets",
      trend: 8,
    },
    {
      label: "تذاكر الدعم المفتوحة",
      value: openTickets.toLocaleString('ar-SA'),
      icon: TicketCheck,
      color: openTickets > 0 ? "text-warning" : "text-success",
      bgGradient: openTickets > 0 ? "from-warning/20 via-warning/10 to-warning/5" : "from-success/20 via-success/10 to-success/5",
      route: "/admin/support",
    },
    {
      label: "رسائل جديدة",
      value: pendingMessages.toLocaleString('ar-SA'),
      icon: MessageSquare,
      color: pendingMessages > 0 ? "text-accent" : "text-muted-foreground",
      bgGradient: pendingMessages > 0 ? "from-accent/20 via-accent/10 to-accent/5" : "from-muted/20 via-muted/10 to-muted/5",
      route: "/admin/support",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3"
      dir="rtl"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => stat.route && navigate(stat.route)}
          className={cn(
            "relative flex items-center gap-3 p-3 sm:p-4 rounded-xl overflow-hidden w-full",
            "bg-gradient-to-l border border-border/30 hover:border-border/50",
            "transition-all duration-300 cursor-pointer group",
            stat.bgGradient
          )}
        >
          {/* Background Glow */}
          <div className={cn(
            "absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity",
            stat.color.replace('text-', 'bg-')
          )} />

          <div className={cn(
            "relative p-2 sm:p-2.5 rounded-xl bg-background/60 backdrop-blur-sm group-hover:scale-110 transition-transform shadow-sm",
            stat.color
          )}>
            <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          
          <div className="min-w-0 flex-1 text-right">
            <div className="flex items-center gap-2 justify-end">
              <p className="text-sm sm:text-base font-bold truncate">{stat.value}</p>
              {stat.trend && (
                <span className="flex items-center gap-0.5 text-[10px] text-success">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {stat.trend}%
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
          </div>

          {/* Hover indicator */}
          <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute left-3 top-1/2 -translate-y-1/2" />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuickStatsRow;
