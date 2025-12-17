import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Shield,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { label: "نظرة عامة", href: "/admin", icon: LayoutDashboard },
  { label: "المستخدمين", href: "/admin/users", icon: Users },
  { label: "الخدمات", href: "/admin/services", icon: Package },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingBag },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

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
          "hidden lg:flex flex-col fixed top-0 right-0 h-full bg-card border-l border-border z-40 transition-all duration-300"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {isSidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-lg block">لوحة الأدمن</span>
                <span className="text-xs text-muted-foreground">ماركت برو</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="shrink-0"
          >
            <ChevronRight className={cn("w-5 h-5 transition-transform", !isSidebarOpen && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive(item.href)
                  ? "bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Admin Info */}
        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3 mb-4", !isSidebarOpen && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            {isSidebarOpen && (
              <div>
                <p className="font-medium text-sm">{profile?.full_name || "المدير"}</p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            className={cn("w-full gap-2", !isSidebarOpen && "px-2")}
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">لوحة الأدمن</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute top-0 right-0 h-full w-72 bg-card border-l border-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-display font-bold">القائمة</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-2">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive(item.href)
                      ? "bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        </motion.div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-16 lg:pt-0",
          isSidebarOpen ? "lg:mr-[280px]" : "lg:mr-[80px]"
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;