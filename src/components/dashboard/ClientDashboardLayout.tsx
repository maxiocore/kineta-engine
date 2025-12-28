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
  ChevronLeft,
  ChevronDown,
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
  Layers,
  Palette,
  Globe,
  FileCode,
  Coins,
  Target,
  Share2,
  Megaphone,
  MonitorSmartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const clientNavItems: NavItem[] = [
  { label: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
  { label: "خدماتنا", href: "/dashboard/our-services", icon: Layers },
  { 
    label: "الطلبات", 
    href: "/dashboard/orders", 
    icon: ShoppingBag,
    children: [
      { label: "جميع الطلبات", href: "/dashboard/orders", icon: Package },
      { label: "مواقع التواصل", href: "/dashboard/orders/social", icon: Share2 },
      { label: "التسويق الرقمي", href: "/dashboard/orders/marketing", icon: Megaphone },
      { label: "التصميم", href: "/dashboard/orders/design", icon: Palette },
      { label: "البرمجة", href: "/dashboard/orders/dev", icon: Code },
    ]
  },
  { label: "المفضلة", href: "/dashboard/favorites", icon: Heart },
  { label: "الإحالات", href: "/dashboard/referrals", icon: Gift },
  { label: "الإيداعات", href: "/dashboard/deposits", icon: History },
  { label: "سجل الرصيد", href: "/dashboard/balance-logs", icon: Wallet },
  { label: "كاش باك", href: "/dashboard/cashback", icon: Coins },
  { label: "الشارات والمكافآت", href: "/dashboard/badges", icon: Award },
  { label: "التحديات", href: "/dashboard/challenges", icon: Target },
  { label: "الإشعارات", href: "/dashboard/notifications", icon: Bell },
  { label: "API", href: "/dashboard/api", icon: Code },
  { label: "الدعم الفني", href: "/dashboard/support", icon: HeadphonesIcon },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];

interface ClientDashboardLayoutProps {
  children: ReactNode;
}

const ClientDashboardLayout = ({ children }: ClientDashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const toggleSubmenu = (href: string) => {
    setExpandedMenus(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const isSubmenuActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => location.pathname.startsWith(child.href));
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      } else if (window.innerWidth >= 1280) {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
      
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

  // Animation variants
  const sidebarVariants = {
    open: { width: 280 },
    closed: { width: 72 }
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    })
  };

  const mobileMenuVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      x: "100%", 
      opacity: 0,
      transition: {
        type: "spring" as const,
        damping: 30,
        stiffness: 400
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full" dir="rtl">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        variants={sidebarVariants}
        animate={isSidebarOpen ? "open" : "closed"}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden lg:flex flex-col fixed top-0 right-0 h-full bg-card/95 backdrop-blur-xl border-l border-border z-40"
        )}
      >
        {/* Logo */}
        <div className="p-4 xl:p-6 border-b border-border flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/" className="flex items-center">
                  <motion.span 
                    className="text-xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    MaxioCore
                  </motion.span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="shrink-0"
              >
                <motion.div
                  animate={{ rotate: isSidebarOpen ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 xl:p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {clientNavItems.map((item, index) => (
            <motion.div
              key={item.href}
              custom={index}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              {item.children ? (
                // Parent item with children
                <div>
                  <motion.button
                    whileHover={{ scale: 1.02, x: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSubmenu(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 xl:px-4 xl:py-3 rounded-xl transition-all relative group overflow-hidden",
                      isSubmenuActive(item) || expandedMenus.includes(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <item.icon className="w-5 h-5 shrink-0 relative z-10" />
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {isSidebarOpen && (
                        <>
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="font-medium whitespace-nowrap relative z-10 flex-1 text-right"
                          >
                            {item.label}
                          </motion.span>
                          <motion.div
                            animate={{ rotate: expandedMenus.includes(item.href) ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  
                  {/* Submenu */}
                  <AnimatePresence>
                    {(expandedMenus.includes(item.href) || isSubmenuActive(item)) && isSidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mr-4 mt-1 space-y-1 border-r-2 border-primary/20 pr-2"
                      >
                        {item.children.map((child) => (
                          <motion.div
                            key={child.href}
                            whileHover={{ x: -4 }}
                          >
                            <Link
                              to={child.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                                isActive(child.href)
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              )}
                            >
                              <child.icon className="w-4 h-4 shrink-0" />
                              <span className="whitespace-nowrap">{child.label}</span>
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Regular item without children
                <motion.div
                  whileHover={{ scale: 1.02, x: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 xl:px-4 xl:py-3 rounded-xl transition-all relative group overflow-hidden",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {!isActive(item.href) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-l from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                    )}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <item.icon className="w-5 h-5 shrink-0 relative z-10" />
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium whitespace-nowrap relative z-10"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ))}
        </nav>

        {/* Balance Section */}
        <div className="p-2 xl:p-4 border-t border-border">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={cn(
              "rounded-xl bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20 p-3 xl:p-4 relative overflow-hidden",
              !isSidebarOpen && "p-2"
            )}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <div className={cn("flex items-center gap-3 relative z-10", !isSidebarOpen && "justify-center")}>
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0"
              >
                <Wallet className="w-4 h-4 xl:w-5 xl:h-5 text-primary-foreground" />
              </motion.div>
              <AnimatePresence mode="wait">
                {isSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1"
                  >
                    <p className="text-xs text-muted-foreground">رصيدك الحالي</p>
                    <p className="text-lg xl:text-xl font-bold text-primary">{balance.toFixed(2)} ر.س</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Button 
                    className="w-full mt-3 gap-2 bg-gradient-to-l from-primary to-accent hover:opacity-90"
                    onClick={() => navigate('/dashboard/deposit')}
                  >
                    <Plus className="w-4 h-4" />
                    إيداع رصيد
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* User Section */}
        <div className="p-2 xl:p-4 border-t border-border">
          <div className={cn("flex items-center gap-3 mb-3 xl:mb-4", !isSidebarOpen && "justify-center")}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-primary flex items-center justify-center"
            >
              <User className="w-4 h-4 xl:w-5 xl:h-5 text-primary-foreground" />
            </motion.div>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <p className="font-medium text-sm">{profile?.full_name || "مستخدم"}</p>
                  <p className="text-xs text-muted-foreground">{profile?.is_verified ? "حساب موثق" : "عميل"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              className={cn("w-full gap-2", !isSidebarOpen && "px-2")}
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              <AnimatePresence mode="wait">
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                  >
                    تسجيل الخروج
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="lg:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-card/95 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-3 sm:px-4"
        dir="rtl"
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button variant="ghost" size="icon" className="w-9 h-9 sm:w-10 sm:h-10" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </motion.div>
        <Link to="/" className="flex items-center">
          <motion.span 
            className="font-bold text-base sm:text-lg bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            MaxioCore
          </motion.span>
        </Link>
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20"
          >
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="font-bold text-primary text-xs sm:text-sm">{balance.toFixed(2)} ر.س</span>
          </motion.div>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden fixed top-0 right-0 h-full w-[300px] max-w-[85vw] bg-card border-l border-border z-[70] overflow-hidden flex flex-col"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-display font-bold text-lg"
                >
                  القائمة
                </motion.span>
                <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>
              
              {/* Balance Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 border-b border-border shrink-0"
              >
                <div className="rounded-xl bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20 p-4 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <div className="flex items-center gap-3 relative z-10">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center"
                    >
                      <Wallet className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">رصيدك الحالي</p>
                      <p className="text-2xl font-bold text-primary">${balance.toFixed(2)}</p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      className="w-full mt-4 gap-2 bg-gradient-to-l from-primary to-accent hover:opacity-90 h-11"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/dashboard/deposit');
                      }}
                    >
                      <Plus className="w-5 h-5" />
                      إيداع رصيد
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {clientNavItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.04 }}
                    whileHover={{ scale: 1.02, x: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative group overflow-hidden",
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:bg-secondary active:bg-secondary/80"
                      )}
                    >
                      {!isActive(item.href) && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-l from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        <item.icon className="w-5 h-5 relative z-10" />
                      </motion.div>
                      <span className="font-medium text-base relative z-10">{item.label}</span>
                      {isActive(item.href) && (
                        <motion.div
                          layoutId="mobileActiveIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full"
                        />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              
              {/* User Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 border-t border-border bg-card/50 backdrop-blur-sm shrink-0"
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center"
                  >
                    <User className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-medium">{profile?.full_name || "مستخدم"}</p>
                    <p className="text-sm text-muted-foreground">{profile?.is_verified ? "حساب موثق ✓" : "عميل"}</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 h-11"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginRight: isMobile ? 0 : (isSidebarOpen ? 280 : 72)
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 pt-14 sm:pt-16 lg:pt-0 w-full"
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
      </motion.main>
    </div>
  );
};

export default ClientDashboardLayout;