import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Bell,
  HeadphonesIcon,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Award,
  Code,
  Wallet,
  Plus,
  History,
  Heart,
  Package,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const clientNavItems: NavItem[] = [
  { label: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
  { label: "طلب جديد", href: "/dashboard/services", icon: Package },
  { label: "الطلبات", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "المفضلة", href: "/dashboard/favorites", icon: Heart },
  { label: "الإحالات", href: "/dashboard/referrals", icon: Gift },
  { label: "الإيداعات", href: "/dashboard/deposits", icon: History },
  { label: "الشارات", href: "/dashboard/badges", icon: Award },
  { label: "الإشعارات", href: "/dashboard/notifications", icon: Bell },
  { label: "API", href: "/dashboard/api", icon: Code },
  { label: "الدعم الفني", href: "/dashboard/support", icon: HeadphonesIcon },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];

interface ClientDashboardLayoutProps {
  children: ReactNode;
}

const ClientDashboardLayout = ({ children }: ClientDashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBalance();
      
      // Real-time subscription for balance updates
      const channel = supabase
        .channel('user-balance')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_balances',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchBalance();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setBalance(data.balance);
    }
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          "hidden lg:flex flex-col fixed top-0 right-0 h-full bg-card border-l border-border z-40 transition-all duration-300"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {isSidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="font-display font-bold text-xl text-primary-foreground">م</span>
              </div>
              <span className="font-display font-bold text-lg">ماركت برو</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="shrink-0"
            >
              <ChevronRight className={cn("w-5 h-5 transition-transform", !isSidebarOpen && "rotate-180")} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {clientNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Balance Section */}
        <div className="p-4 border-t border-border">
          <div className={cn(
            "rounded-xl bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20 p-4",
            !isSidebarOpen && "p-2"
          )}>
            <div className={cn("flex items-center gap-3", !isSidebarOpen && "justify-center")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              {isSidebarOpen && (
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">رصيدك الحالي</p>
                  <p className="text-xl font-bold text-primary">${balance.toFixed(2)}</p>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <Button 
                className="w-full mt-3 gap-2 bg-gradient-to-l from-primary to-accent hover:opacity-90"
                onClick={() => navigate('/dashboard/deposit')}
              >
                <Plus className="w-4 h-4" />
                إيداع رصيد
              </Button>
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3 mb-4", !isSidebarOpen && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            {isSidebarOpen && (
              <div>
                <p className="font-medium text-sm">{profile?.full_name || "مستخدم"}</p>
                <p className="text-xs text-muted-foreground">{profile?.is_verified ? "حساب موثق" : "عميل"}</p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            className={cn("w-full gap-2", !isSidebarOpen && "px-2")}
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-card/95 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-3 sm:px-4">
        <Button variant="ghost" size="icon" className="w-9 h-9 sm:w-10 sm:h-10" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="font-bold text-sm sm:text-base text-primary-foreground">م</span>
          </div>
          <span className="font-bold text-sm sm:text-base hidden xs:block">ماركت برو</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="font-bold text-primary text-xs sm:text-sm">${balance.toFixed(2)}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 h-full w-[280px] max-w-[85vw] bg-card border-l border-border overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <span className="font-display font-bold">القائمة</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Balance in Mobile Menu */}
              <div className="p-4 border-b border-border">
                <div className="rounded-xl bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">رصيدك الحالي</p>
                      <p className="text-xl font-bold text-primary">${balance.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-3 gap-2 bg-gradient-to-l from-primary to-accent hover:opacity-90"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/dashboard/deposit');
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    إيداع رصيد
                  </Button>
                </div>
              </div>
              
              {/* Navigation Links */}
              <nav className="p-4 space-y-2 pb-20">
                {clientNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
              
              {/* User Section at Bottom */}
              <div className="p-4 border-t border-border bg-card sticky bottom-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{profile?.full_name || "مستخدم"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.is_verified ? "حساب موثق" : "عميل"}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-14 sm:pt-16 lg:pt-0",
          isSidebarOpen ? "lg:mr-[280px]" : "lg:mr-[80px]"
        )}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default ClientDashboardLayout;