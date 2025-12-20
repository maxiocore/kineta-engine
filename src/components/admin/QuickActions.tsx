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
    <Card className="border-border/30 overflow-hidden" dir="rtl">
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="flex flex-row-reverse items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </motion.div>
          <h3 className="text-xs sm:text-sm lg:text-base font-bold">إجراءات سريعة</h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link to={action.href}>
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group"
                >
                  <div className="relative p-1.5 sm:p-2 lg:p-3 rounded-md sm:rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 text-center overflow-hidden">
                    {/* Background Gradient on Hover */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                      `bg-gradient-to-br ${action.color}`
                    )} />
                    
                    <motion.div
                      className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-md mx-auto mb-1 sm:mb-1.5 flex items-center justify-center shadow-sm",
                        `bg-gradient-to-br ${action.color}`
                      )}
                      whileHover={{ rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <action.icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary-foreground" />
                    </motion.div>
                    
                    <p className="font-medium text-[9px] sm:text-[10px] lg:text-xs mb-0 truncate">{action.label}</p>
                    <p className="text-[7px] sm:text-[9px] lg:text-[10px] text-muted-foreground hidden sm:block truncate">{action.description}</p>
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
