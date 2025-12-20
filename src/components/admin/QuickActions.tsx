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
      <CardContent className="p-3 sm:p-4 lg:p-5">
        <div className="flex flex-row-reverse items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </motion.div>
          <h3 className="text-sm sm:text-base lg:text-lg font-bold">إجراءات سريعة</h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
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
                  <div className="relative p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 text-center overflow-hidden">
                    {/* Background Gradient on Hover */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                      `bg-gradient-to-br ${action.color}`
                    )} />
                    
                    <motion.div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg mx-auto mb-1.5 sm:mb-2 flex items-center justify-center shadow-md",
                        `bg-gradient-to-br ${action.color}`
                      )}
                      whileHover={{ rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-foreground" />
                    </motion.div>
                    
                    <p className="font-medium text-[10px] sm:text-xs lg:text-sm mb-0.5 truncate">{action.label}</p>
                    <p className="text-[8px] sm:text-[10px] lg:text-xs text-muted-foreground hidden sm:block">{action.description}</p>
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
