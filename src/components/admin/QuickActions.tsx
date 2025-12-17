import { motion } from "framer-motion";
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Settings, 
  Bell,
  Package,
  MessageSquare,
  FileText,
  LucideIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

const quickActions: QuickAction[] = [
  { 
    label: "المستخدمين", 
    href: "/admin/users", 
    icon: Users, 
    color: "from-primary to-cyan-400",
    description: "إدارة الحسابات"
  },
  { 
    label: "الطلبات", 
    href: "/admin/orders", 
    icon: ShoppingBag, 
    color: "from-success to-emerald-400",
    description: "متابعة الطلبات"
  },
  { 
    label: "الخدمات", 
    href: "/admin/services", 
    icon: Package, 
    color: "from-accent to-pink-400",
    description: "إدارة الخدمات"
  },
  { 
    label: "الدعم", 
    href: "/admin/support", 
    icon: MessageSquare, 
    color: "from-warning to-orange-400",
    description: "تذاكر الدعم"
  },
  { 
    label: "التقارير", 
    href: "/admin/reports", 
    icon: TrendingUp, 
    color: "from-destructive to-red-400",
    description: "الإحصائيات"
  },
  { 
    label: "الإعدادات", 
    href: "/admin/settings", 
    icon: Settings, 
    color: "from-slate-500 to-slate-400",
    description: "إعدادات النظام"
  },
];

const QuickActions = () => {
  return (
    <Card className="card-elevated border-border/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-5 h-5 text-primary" />
          </motion.div>
          <h3 className="text-lg font-bold">إجراءات سريعة</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={action.href}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group"
                >
                  <div className="relative p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-300 text-center overflow-hidden">
                    {/* Background Gradient on Hover */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                      `bg-gradient-to-br ${action.color}`
                    )} />
                    
                    <motion.div
                      className={cn(
                        "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg",
                        `bg-gradient-to-br ${action.color}`
                      )}
                      whileHover={{ rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <action.icon className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                    
                    <p className="font-medium text-sm mb-0.5">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
