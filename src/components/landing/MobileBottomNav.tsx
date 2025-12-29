import { motion } from "framer-motion";
import { Home, Briefcase, Grid3X3, Star, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "الرئيسية", href: "/" },
    { icon: Briefcase, label: "الخدمات", href: "/our-services" },
    { icon: Grid3X3, label: "الباقات", href: "/pricing" },
    { icon: Star, label: "العروض", href: "/our-services" },
    { icon: User, label: "حسابي", href: "/auth" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
    >
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-border/50" />
      
      {/* Safe area padding for iOS */}
      <div className="relative px-2 pt-2 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={index}
                to={item.href}
                className="relative flex flex-col items-center py-2 px-3 min-w-[64px]"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -inset-2 bg-primary/15 rounded-2xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  <div className={`relative flex flex-col items-center gap-1 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}>
                    <motion.div
                      animate={{ 
                        scale: active ? 1.1 : 1,
                        y: active ? -2 : 0
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                    </motion.div>
                    <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
