import { motion } from "framer-motion";
import { 
  Users, 
  ShoppingBag, 
  Package,
  MessageSquare,
  TrendingUp,
  Settings,
  Wallet,
  Bell,
  LucideIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const quickActions: QuickAction[] = [
  { label: "المستخدمين", href: "/admin/users", icon: Users, color: "from-primary to-cyan-500" },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingBag, color: "from-success to-emerald-500" },
  { label: "الخدمات", href: "/admin/services", icon: Package, color: "from-accent to-pink-500" },
  { label: "الدعم الفني", href: "/admin/support", icon: MessageSquare, color: "from-warning to-orange-500" },
  { label: "المحافظ", href: "/admin/wallets", icon: Wallet, color: "from-violet-500 to-purple-500" },
  { label: "الإشعارات", href: "/admin/notifications", icon: Bell, color: "from-rose-500 to-red-500" },
  { label: "التقارير", href: "/admin/reports", icon: TrendingUp, color: "from-teal-500 to-cyan-500" },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings, color: "from-slate-500 to-slate-600" },
];

const MobileQuickActions = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border/40 p-3"
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-3 flex-row-reverse justify-end">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Settings className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold">إجراءات سريعة</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Link to={action.href}>
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 active:bg-secondary/80 transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm",
                  `bg-gradient-to-br ${action.color}`
                )}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] font-medium text-center leading-tight">{action.label}</span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MobileQuickActions;
