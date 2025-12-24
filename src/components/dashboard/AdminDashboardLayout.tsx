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
  Menu,
  X,
  Shield,
  Search,
  Sparkles,
  Ticket,
  Award,
  CreditCard,
  RefreshCw,
  Layers,
  Globe,
  Gift,
  Wallet,
  Coins,
  HeadphonesIcon,
  Mail,
  FileText,
  Building2,
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
  { label: "السحب البنكي", href: "/admin/bank-withdrawals", icon: Building2 },
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

const AdminDashboardLayout = ({ children }: AdminDashboardLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navBadges, setNavBadges] = useState<Record<string, number>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

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
    <div className="min-h-screen bg-background flex w-full" dir="rtl">
      {/* Desktop Sidebar - Fixed Right */}
      <aside className="hidden lg:flex flex-col fixed top-0 right-0 h-full w-[260px] z-40 bg-card border-l border-border/50">
        {/* Logo Section */}
        <div className="p-4 border-b border-border/40">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="font-bold text-lg">لوحة الأدمن</h1>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ماركت برو
              </span>
            </div>
          </Link>
        </div>

        {/* Actions Row */}
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← العودة
          </Link>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border/30">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="بحث سريع..."
              className="pr-9 pl-10 bg-secondary/50 border-border/40 h-10 text-sm rounded-lg"
            />
            <kbd className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              K⌘
            </kbd>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          {adminNavItems.map((item) => {
            const active = isActive(item.href);
            const badge = navBadges[item.href];
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  active
                    ? "bg-gradient-to-l from-destructive to-orange-500 text-white shadow-md"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  active ? "bg-white/20" : "bg-secondary/60 group-hover:bg-secondary"
                )}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm flex-1">{item.label}</span>
                
                {badge && badge > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-full",
                    active ? "bg-white/20 text-white" : "bg-destructive/10 text-destructive"
                  )}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Info Footer */}
        <div className="p-3 border-t border-border/40 bg-secondary/20">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{profile?.full_name || "المدير"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Super Admin
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full h-9 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 text-sm rounded-lg"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            <span>الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-xl border-b border-border/50 z-50">
        <div className="h-full flex items-center justify-between px-3" dir="rtl">
          {/* Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">لوحة الأدمن</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                ماركت برو
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="absolute top-0 right-0 h-full w-[85vw] max-w-[320px] bg-card border-l border-border/50 flex flex-col"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Mobile Menu Header */}
              <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">لوحة التحكم</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      ماركت برو
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg w-9 h-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile Search */}
              <div className="p-3 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث سريع..."
                    className="pr-9 h-10 bg-secondary/50 border-border/40 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          active
                            ? "bg-gradient-to-l from-destructive to-orange-500 text-white"
                            : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          active ? "bg-white/20" : "bg-secondary/50"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        
                        <span className="font-medium text-sm flex-1">{item.label}</span>
                        
                        {badge && badge > 0 && (
                          <span className={cn(
                            "min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full",
                            active ? "bg-white/20 text-white" : "bg-destructive text-white"
                          )}>
                            {badge}
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Mobile Admin Info */}
              <div className="p-3 border-t border-border/40 bg-secondary/20">
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-secondary/40">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{profile?.full_name || "المدير"}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Super Admin
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-10 gap-2 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 text-sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  الخروج
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-inset-bottom">
        <div className="h-full grid grid-cols-5 items-center" dir="rtl">
          {[
            { href: "/admin", icon: LayoutDashboard, label: "الرئيسية" },
            { href: "/admin/orders", icon: ShoppingBag, label: "الطلبات", badge: navBadges["/admin/orders"] },
            { href: "/admin/users", icon: Users, label: "المستخدمين" },
            { href: "/admin/services", icon: Package, label: "الخدمات" },
            { href: "/admin/settings", icon: Settings, label: "الإعدادات" },
          ].map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-full relative transition-colors",
                  active ? "text-destructive" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    "w-5 h-5 transition-all",
                    active && "scale-110"
                  )} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full bg-destructive text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  active && "text-destructive"
                )}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-destructive"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:mr-[260px] min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="p-2.5 sm:p-4 lg:p-6 max-w-7xl mx-auto pb-4 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
