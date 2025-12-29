import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronLeft, Home, Briefcase, Users, CreditCard, MessageCircle, LucideIcon, Zap } from "lucide-react";
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "py-2 lg:py-3" 
            : "py-3 lg:py-5"
        }`}
      >
        {/* Background with blur and gradient */}
        <motion.div 
          className={`absolute inset-0 transition-all duration-500 ${
            isScrolled 
              ? "bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-lg shadow-background/5" 
              : "bg-transparent"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        
        <div className="container px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0 group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <motion.div
                  className="absolute -inset-2 rounded-xl bg-gradient-to-l from-primary/20 via-accent/10 to-transparent opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"
                />
                <span 
                  className="relative text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  MaxioCore
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-secondary/50 backdrop-blur-xl border border-border/30">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="relative"
                  >
                    <motion.div
                      className={`relative px-4 xl:px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive(item.href)
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive(item.href) && (
                        <motion.div
                          layoutId="activeNavBg"
                          className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/25"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <ThemeToggle />
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-sm font-medium rounded-xl px-4"
                  >
                    تسجيل الدخول
                  </Button>
                </motion.div>
              </Link>
              <Link to="/auth?mode=signup">
                <motion.div 
                  whileHover={{ scale: 1.03, y: -1 }} 
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <motion.div
                    className="absolute -inset-1 rounded-xl bg-gradient-to-l from-primary via-accent to-primary opacity-50 blur-lg group-hover:opacity-80 transition-opacity"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <Button 
                    size="sm" 
                    className="relative bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-xl hover:shadow-2xl transition-all px-5 rounded-xl text-sm font-semibold"
                  >
                    <Zap className="w-4 h-4 ml-2" />
                    ابدأ مجاناً
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                  isMobileMenuOpen 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary/80 hover:bg-secondary text-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
                aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-xl z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-background/95 backdrop-blur-2xl border-l border-border/50 z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex flex-col min-h-full p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                    <span 
                      className="text-xl font-bold bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    >
                      MaxioCore
                    </span>
                  </Link>
                  <motion.button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Status Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20 mb-6"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-success"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm text-success font-medium">المنصة تعمل بكفاءة</span>
                </motion.div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1.5">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 + 0.15 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 ${
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isActive(item.href) 
                              ? "bg-primary-foreground/20" 
                              : "bg-secondary"
                          }`}>
                            <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-primary-foreground' : 'text-primary'}`} />
                          </div>
                          <span className="text-base font-medium">{item.label}</span>
                        </div>
                        <ChevronLeft className={`w-5 h-5 ${isActive(item.href) ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* CTA Buttons */}
                <motion.div 
                  className="pt-6 mt-6 border-t border-border/50 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full py-5 rounded-2xl text-base font-medium border-border/50 hover:bg-secondary/50">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button className="w-full py-5 rounded-2xl bg-gradient-to-l from-primary to-accent shadow-xl shadow-primary/20 text-base font-semibold">
                      <Sparkles className="w-4 h-4 ml-2" />
                      ابدأ الآن مجاناً
                    </Button>
                  </Link>
                </motion.div>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 pt-4 text-center"
                >
                  <p className="text-xs text-muted-foreground">
                    © 2024 MaxioCore. جميع الحقوق محفوظة.
                  </p>
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
