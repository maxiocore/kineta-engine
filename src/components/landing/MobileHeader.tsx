import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Briefcase, Info, Phone, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinks = [
  { icon: Home, label: "الرئيسية", href: "/" },
  { icon: Briefcase, label: "خدماتنا", href: "#services" },
  { icon: Info, label: "من نحن", href: "/about" },
  { icon: Phone, label: "تواصل معنا", href: "/contact" },
];

const MobileHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
              MaxioCore
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium text-green-600 dark:text-green-400">متصل</span>
            </div>

            {/* Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 z-50 h-full w-[280px] bg-background border-l border-border/50 shadow-2xl"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <span className="text-lg font-bold text-foreground">القائمة</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Links */}
              <nav className="p-4">
                <ul className="space-y-2">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.href;
                    return (
                      <li key={link.label}>
                        <Link
                          to={link.href}
                          onClick={() => handleLinkClick(link.href)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <link.icon className="w-5 h-5" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* CTA Buttons */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background">
                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-gradient-to-l from-primary to-accent"
                  >
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <User className="w-4 h-4 ml-2" />
                      تسجيل الدخول
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-12 rounded-xl border-2"
                  >
                    <Link to="/contact" onClick={() => setIsOpen(false)}>
                      ابدأ مشروعك
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileHeader;
