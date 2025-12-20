import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Shield,
  Mail,
  FileText,
  HeadphonesIcon,
  Sparkles,
  Search,
  Command,
  Ticket,
  Award,
  CreditCard,
  RefreshCw,
  Layers,
  Globe,
  Gift,
  Wallet,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/admin/NotificationBell";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const adminNavItems: NavItem[] = [
  { label: "نظرة عامة", href: "/admin", icon: LayoutDashboard },
  { label: "المستخدمين", href: "/admin/users", icon: Users },
  { label: "الأقسام", href: "/admin/categories", icon: Layers },
  { label: "الخدمات", href: "/admin/services", icon: Package },
  { label: "المزودين", href: "/admin/providers", icon: Globe },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingBag },
  { label: "الإحالات", href: "/admin/referrals", icon: Gift },
  { label: "طرق الدفع", href: "/admin/payments", icon: CreditCard },
  { label: "المحافظ", href: "/admin/wallets", icon: Wallet },
  { label: "كاش باك", href: "/admin/cashback", icon: Coins },
  { label: "إعادة التعبئة", href: "/admin/refills", icon: RefreshCw },
  { label: "الكوبونات", href: "/admin/coupons", icon: Ticket },
  { label: "الشارات", href: "/admin/badges", icon: Award },
  { label: "المكافآت", href: "/admin/rewards", icon: Sparkles },
  { label: "الدعم الفني", href: "/admin/support", icon: HeadphonesIcon },
  { label: "الإشعارات", href: "/admin/notifications", icon: Bell },
  { label: "البريد", href: "/admin/emails", icon: Mail },
  { label: "سجل العمليات", href: "/admin/logs", icon: FileText },
  { label: "التقارير", href: "/admin/reports", icon: BarChart3 },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings },
];

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

const AnimatedIcon = ({ 
  icon: Icon, 
  isActive, 
  className 
}: { 
  icon: React.ElementType; 
  isActive: boolean; 
  className?: string;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn("relative", className)}
    >
      <Icon className={cn(
        "w-5 h-5 transition-all duration-300",
        isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]"
      )} />
      {isActive && (
        <motion.div
          layoutId="iconGlow"
          className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

const AdminDashboardLayout = ({ children }: AdminDashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navBadges, setNavBadges] = useState<Record<string, number>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  // Fetch badge counts for navigation items
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const { count: pendingOrders } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        const { count: openTickets } = await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "in_progress"]);

        setNavBadges({
          "/admin/orders": pendingOrders || 0,
          "/admin/support": openTickets || 0,
        });
      } catch (error) {
        console.error("Error fetching badge counts:", error);
      }
    };

    fetchBadgeCounts();

    // Real-time updates for badges
    const ordersChannel = supabase
      .channel("nav-badges-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchBadgeCounts)
      .subscribe();

    const ticketsChannel = supabase
      .channel("nav-badges-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, fetchBadgeCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
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
          "hidden lg:flex flex-col fixed top-0 right-0 h-full z-40 transition-all duration-300",
          "bg-gradient-to-b from-card via-card to-background border-l border-border/50"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Link to="/" className="flex items-center gap-3">
                <motion.div 
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg shadow-destructive/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <div>
                  <span className="font-bold text-lg block">لوحة الأدمن</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    ماركت برو
                  </span>
                </div>
              </Link>
            </motion.div>
          )}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="shrink-0 hover:bg-secondary/80"
            >
              <motion.div
                animate={{ rotate: isSidebarOpen ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.div>
            </Button>
          </div>
        </div>

        {/* Search (when sidebar is open) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 border-b border-border/30"
            >
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="بحث سريع..."
                  className="pr-9 pl-12 bg-secondary/50 border-border/50 h-9 text-sm"
                />
                <kbd className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminNavItems.map((item, index) => {
            const badge = navBadges[item.href];
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive(item.href)
                      ? "bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground shadow-lg shadow-destructive/20"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {/* Hover Effect */}
                  {!isActive(item.href) && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-l from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                  
                  <AnimatedIcon 
                    icon={item.icon} 
                    isActive={isActive(item.href)} 
                    className="shrink-0"
                  />
                  
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap flex-1"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge */}
                  {badge && badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "px-2 py-0.5 text-xs font-bold rounded-full",
                        isActive(item.href)
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {badge}
                    </motion.span>
                  )}

                  {/* Active Indicator */}
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Admin Info */}
        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-secondary/30 to-transparent">
          <div className={cn("flex items-center gap-3 mb-3", !isSidebarOpen && "justify-center")}>
            <motion.div 
              className="w-11 h-11 rounded-full bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg shadow-destructive/20"
              whileHover={{ scale: 1.05 }}
            >
              <Shield className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium truncate">{profile?.full_name || "المدير"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Super Admin
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              className={cn(
                "w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive",
                !isSidebarOpen && "px-2"
              )}
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              {isSidebarOpen && <span>تسجيل الخروج</span>}
            </Button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Mobile Header - Enhanced */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-xl border-b border-border/40 z-50 shadow-sm">
        <div className="h-full flex items-center justify-between px-3 safe-area-inset">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-xl hover:bg-secondary/80" 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg shadow-destructive/30">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">لوحة الأدمن</span>
              <span className="text-[10px] text-muted-foreground leading-tight">ماركت برو</span>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Menu - Enhanced */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-md z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute top-0 right-0 h-full w-[88vw] max-w-[320px] bg-gradient-to-b from-card via-card to-background border-l border-border/40 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-b from-secondary/20 to-transparent">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <span className="font-bold block">لوحة التحكم</span>
                    <span className="text-xs text-muted-foreground">ماركت برو</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Search */}
              <div className="p-3 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث سريع..."
                    className="pr-10 h-11 bg-secondary/50 border-border/40 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Navigation - Scrollable */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 overscroll-contain">
                {adminNavItems.map((item, index) => {
                  const badge = navBadges[item.href];
                  const active = isActive(item.href);
                  
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                          active
                            ? "bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground shadow-lg shadow-destructive/20"
                            : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground active:scale-[0.98]"
                        )}
                      >
                        {/* Active indicator */}
                        {active && (
                          <motion.div
                            layoutId="mobileActiveNav"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                          />
                        )}
                        
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          active ? "bg-white/20" : "bg-secondary/50 group-hover:bg-secondary"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        
                        <span className="font-medium flex-1 text-sm">{item.label}</span>
                        
                        {badge && badge > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              "min-w-6 h-6 px-2 flex items-center justify-center text-xs font-bold rounded-full",
                              active
                                ? "bg-white/20 text-white"
                                : "bg-destructive text-destructive-foreground"
                            )}
                          >
                            {badge}
                          </motion.span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Mobile Admin Info - Fixed Bottom */}
              <div className="p-4 border-t border-border/40 bg-gradient-to-t from-secondary/30 to-transparent">
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/30">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{profile?.full_name || "المدير"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      Super Admin • متصل
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-11 gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Enhanced for mobile */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-14 lg:pt-0 min-h-screen",
          isSidebarOpen ? "lg:mr-[280px]" : "lg:mr-[80px]"
        )}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20 lg:pb-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
