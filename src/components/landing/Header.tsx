import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronLeft, Home, Briefcase, Share2, Users, CreditCard, MessageCircle, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "خدماتنا", href: "/our-services", icon: Briefcase },
  { label: "SMM Panel", href: "/services", icon: Share2 },
  { label: "من نحن", href: "/about", icon: Users },
  { label: "الأسعار", href: "/pricing", icon: CreditCard },
  { label: "تواصل معنا", href: "/contact", icon: MessageCircle },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-background/80 backdrop-blur-2xl border-b border-border/40 py-2 md:py-3 shadow-lg shadow-background/10" 
            : "py-3 md:py-4"
        }`}
      >
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
              <motion.div 
                className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="font-bold text-lg md:text-xl text-primary-foreground relative z-10">م</span>
              </motion.div>
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg leading-tight">ماركت برو</span>
                <span className="text-[9px] md:text-[10px] text-muted-foreground leading-tight hidden sm:block">حلول تسويقية متكاملة</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 bg-secondary/40 backdrop-blur-xl rounded-full px-1.5 py-1 border border-border/30">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="relative"
                >
                  <motion.div
                    className={`px-4 xl:px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-l from-primary to-accent rounded-full shadow-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </motion.div>
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
              <ThemeToggle />
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl"
                >
                  تسجيل الدخول
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="sm" className="relative overflow-hidden bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all rounded-xl px-4 xl:px-6">
                    <Sparkles className="w-4 h-4 ml-1.5" />
                    ابدأ الآن
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/30"
                whileTap={{ scale: 0.95 }}
                aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-background/95 backdrop-blur-xl border-l border-border/50 z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex flex-col min-h-full p-6">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between mb-8">
                  <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                      <span className="font-bold text-lg text-primary-foreground">م</span>
                    </div>
                    <span className="font-bold text-lg">ماركت برو</span>
                  </Link>
                  <motion.button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <nav className="flex-1 space-y-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                          isActive(item.href)
                            ? "bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold shadow-lg"
                            : "text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isActive(item.href) 
                              ? "bg-white/20" 
                              : "bg-secondary/70"
                          }`}>
                            <item.icon className={`w-4.5 h-4.5 ${isActive(item.href) ? 'text-primary-foreground' : 'text-primary'}`} />
                          </div>
                          <span className="text-base">{item.label}</span>
                        </div>
                        <ChevronLeft className={`w-5 h-5 ${isActive(item.href) ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile CTA Buttons */}
                <motion.div 
                  className="pt-6 mt-6 border-t border-border/50 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full py-5 rounded-xl text-base border-border/50">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button className="w-full py-5 rounded-xl text-base bg-gradient-to-l from-primary to-accent shadow-lg shadow-primary/30">
                      <Sparkles className="w-4 h-4 ml-2" />
                      ابدأ الآن مجاناً
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
