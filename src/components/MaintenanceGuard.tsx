import { ReactNode } from "react";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { useAuth } from "@/hooks/useAuth";
import MaintenancePage from "@/pages/MaintenancePage";
import { Loader2 } from "lucide-react";

interface MaintenanceGuardProps {
  children: ReactNode;
}

const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();
  const { isAdmin } = useAuth();

  // Show loading while checking maintenance status
  if (maintenanceLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If maintenance mode is on and user is not admin, show maintenance page
  // But allow access to admin auth page
  if (isMaintenanceMode && !isAdmin) {
    const isAdminAuthPage = window.location.pathname === '/admin/auth';
    if (!isAdminAuthPage) {
      return <MaintenancePage />;
    }
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
