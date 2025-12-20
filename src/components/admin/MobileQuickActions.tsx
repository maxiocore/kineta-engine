import { motion } from "framer-motion";
import { 
  Users, 
  ShoppingBag, 
  Package,
  MessageSquare,
  TrendingUp,
  Settings,
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
  { label: "المستخدمين", href: "/admin/users", icon: Users, color: "from-primary to-cyan-400" },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingBag, color: "from-success to-emerald-400" },
  { label: "الخدمات", href: "/admin/services", icon: Package, color: "from-accent to-pink-400" },
  { label: "الدعم", href: "/admin/support", icon: MessageSquare, color: "from-warning to-orange-400" },
  { label: "التقارير", href: "/admin/reports", icon: TrendingUp, color: "from-destructive to-red-400" },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings, color: "from-slate-500 to-slate-400" },
];

const MobileQuickActions = () => {
  return (
    <div className="bg-card rounded-xl border border-border/40 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">إجراءات سريعة</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={action.href}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors"
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  `bg-gradient-to-br ${action.color}`
                )}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-medium text-center">{action.label}</span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MobileQuickActions;
