import { motion } from "framer-motion";
import { Home, Grid3X3, Briefcase, User, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "الرئيسية", href: "/" },
  { icon: Grid3X3, label: "الخدمات", href: "#services" },
  { icon: Briefcase, label: "أعمالنا", href: "#portfolio" },
  { icon: MessageCircle, label: "تواصل", href: "/contact" },
  { icon: User, label: "حسابي", href: "/auth" },
];

const NewMobileBottomNav = () => {
  const location = useLocation();

  const handleClick = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-border/30 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isHashLink = item.href.startsWith("#");

          const content = (
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 mb-1 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                />
              )}
            </motion.div>
          );

          if (isHashLink) {
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item.href)}
                className="relative flex-1"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href}
              className="relative flex-1"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default NewMobileBottomNav;
