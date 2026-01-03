import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronLeft, Home, Briefcase, Share2, Users, CreditCard, MessageCircle, LucideIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { usePWAInstall } from "@/hooks/usePWAInstall";

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
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
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
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-background/95 backdrop-blur-xl border-b border-border/50 py-2 xs:py-2.5 sm:py-3 shadow-sm" 
            : "py-2.5 xs:py-3 sm:py-4 md:py-5"
        }`}
      >
        <div className="container px-3 xs:px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0 group">
              <motion.span 
                className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                MaxioCore
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="relative px-3 xl:px-4 py-2"
                >
                  <motion.span
                    className={`relative z-10 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    {item.label}
                  </motion.span>
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
              <ThemeToggle />
              
              {/* Install Button - Desktop */}
              {(isInstallable || isIOS) && !isInstalled && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={isIOS ? () => setShowIOSInstructions(true) : installApp}
                    className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Download className="w-4 h-4" />
                    تثبيت التطبيق
                  </Button>
                </motion.div>
              )}
              
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  تسجيل الدخول
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="sm" className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-brand hover:shadow-lg transition-shadow px-4 xl:px-5 text-sm">
                    <Sparkles className="w-4 h-4 ml-1.5 xl:ml-2" />
                    ابدأ الآن
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 xs:gap-2 lg:hidden">
              <ThemeToggle />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative p-2 xs:p-2.5 rounded-lg xs:rounded-xl bg-secondary/80 hover:bg-secondary transition-colors"
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
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-4 h-4 xs:w-5 xs:h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="w-4 h-4 xs:w-5 xs:h-5" />
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] xs:w-[80%] max-w-sm bg-background border-l border-border z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex flex-col min-h-full p-4 xs:p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 xs:mb-8">
                  <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                    <span 
                      className="text-lg xs:text-xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    >
                      MaxioCore
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 xs:p-2 rounded-lg xs:rounded-xl bg-secondary/80 hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4 xs:w-5 xs:h-5" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 xs:px-4 py-3 xs:py-3.5 rounded-lg xs:rounded-xl transition-all ${
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground font-semibold shadow-brand"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 xs:gap-3">
                          <div className={`w-8 h-8 xs:w-9 xs:h-9 rounded-lg flex items-center justify-center ${
                            isActive(item.href) 
                              ? "bg-primary-foreground/20" 
                              : "bg-secondary"
                          }`}>
                            <item.icon className={`w-3.5 h-3.5 xs:w-4 xs:h-4 ${isActive(item.href) ? 'text-primary-foreground' : 'text-primary'}`} />
                          </div>
                          <span className="text-sm xs:text-base">{item.label}</span>
                        </div>
                        <ChevronLeft className={`w-4 h-4 xs:w-5 xs:h-5 ${isActive(item.href) ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* CTA */}
                <motion.div 
                  className="pt-4 xs:pt-6 mt-4 xs:mt-6 border-t border-border space-y-2.5 xs:space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full py-4 xs:py-5 rounded-lg xs:rounded-xl text-sm xs:text-base">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button className="w-full py-4 xs:py-5 rounded-lg xs:rounded-xl bg-gradient-to-l from-primary to-accent shadow-brand text-sm xs:text-base">
                      <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4 ml-1.5 xs:ml-2" />
                      ابدأ الآن مجاناً
                    </Button>
                  </Link>
                  
                  {/* Mobile Install Button */}
                  {(isInstallable || isIOS) && !isInstalled && (
                    <Button 
                      variant="outline" 
                      className="w-full py-4 xs:py-5 rounded-lg xs:rounded-xl border-primary/30 text-primary text-sm xs:text-base"
                      onClick={() => {
                        if (isIOS) {
                          setShowIOSInstructions(true);
                        } else {
                          installApp();
                        }
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Download className="w-3.5 h-3.5 xs:w-4 xs:h-4 ml-1.5 xs:ml-2" />
                      تثبيت التطبيق
                    </Button>
                  )}
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
