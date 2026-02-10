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
  Target,
  Gift,
  Wallet,
  Coins,
  HeadphonesIcon,
  Mail,
  FileText,
  MessageSquareText,
  Landmark,
  
  Server,
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
  { label: "الخدمات", href: "/admin/services", icon: Package },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingBag },
  { label: "الإحالات", href: "/admin/referrals", icon: Gift },
  { label: "مركز المدفوعات", href: "/admin/payments-hub", icon: CreditCard },
  { label: "المركز المالي", href: "/admin/financial", icon: Landmark },
  
  { label: "الكوبونات", href: "/admin/coupons", icon: Ticket },
  { label: "الشارات", href: "/admin/badges", icon: Award },
  { label: "التحديات", href: "/admin/challenges", icon: Target },
  { label: "المكافآت", href: "/admin/rewards", icon: Sparkles },
  { label: "الدعم الفني", href: "/admin/support", icon: HeadphonesIcon },
  { label: "رسائل التواصل", href: "/admin/contact-messages", icon: MessageSquareText },
  { label: "الإشعارات", href: "/admin/notifications", icon: Bell },
  { label: "إشعارات التطبيق", href: "/admin/app-notifications", icon: Bell },
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
        // Count pending orders (only from active services)
        const { data: pendingOrdersData } = await supabase
          .from("orders")
          .select("id, service:services!inner(status)")
          .not("status", "in", '("completed","cancelled","refunded")')
          .eq("service.status", "active");

        // Count pending dev orders
        const { count: pendingDevOrders } = await supabase
          .from("dev_orders")
          .select("*", { count: "exact", head: true })
          .not("status", "in", '("completed","cancelled","rejected")');

        // Count open support tickets
        const { count: openTickets } = await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "in_progress"]);

        const totalPendingOrders = (pendingOrdersData?.length || 0) + (pendingDevOrders || 0);

        setNavBadges({
          "/admin/orders": totalPendingOrders,
          "/admin/support": openTickets || 0,
        });
      } catch (error) {
        console.error("Error fetching badge counts:", error);
      }
    };

    fetchBadgeCounts();

    // Real-time subscriptions
    const ordersChannel = supabase
      .channel("admin-nav-badges-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchBadgeCounts)
      .subscribe();

    const devOrdersChannel = supabase
      .channel("admin-nav-badges-dev-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "dev_orders" }, fetchBadgeCounts)
      .subscribe();

    const ticketsChannel = supabase
      .channel("admin-nav-badges-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, fetchBadgeCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(devOrdersChannel);
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
    <div className="min-h-screen bg-background flex w-full admin-rtl" dir="rtl" lang="ar">
      {/* Desktop Sidebar - Fixed Right - Hidden on mobile with display:none */}
      <aside className="hidden lg:flex flex-col fixed top-0 right-0 h-full w-[260px] z-40 bg-card border-l border-border/50">
        {/* Logo Section */}
        <div className="p-4 border-b border-border/40">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="font-bold text-lg">لوحة الأدمن</h1>
              <span 
                className="text-sm font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                ASH HOLDING
              </span>
            </div>
          </Link>
        </div>

        {/* Actions Row with Logout */}
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </Button>
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
              <span 
                className="text-xs font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                ASH HOLDING
              </span>
            </div>
          </div>
          
          {/* Actions with Logout */}
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </Button>
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
                    <span 
                      className="text-xs font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    >
                      ASH HOLDING
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

      {/* Main Content */}
      <main className="flex-1 lg:mr-[260px] min-h-screen">
        {/* Add top padding on mobile for fixed header */}
        <div className="pt-14 lg:pt-0">
          <div className="p-3 sm:p-4 lg:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
