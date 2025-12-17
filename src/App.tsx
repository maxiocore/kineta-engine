import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Client Dashboard
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ClientOrders from "./pages/dashboard/ClientOrders";
import ClientNotifications from "./pages/dashboard/ClientNotifications";
import ClientSupport from "./pages/dashboard/ClientSupport";
import ClientSettings from "./pages/dashboard/ClientSettings";

// Admin Dashboard
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminServices from "./pages/admin/AdminServices";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminLogs from "./pages/admin/AdminLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Client Dashboard Routes */}
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/dashboard/orders" element={<ClientOrders />} />
          <Route path="/dashboard/notifications" element={<ClientNotifications />} />
          <Route path="/dashboard/support" element={<ClientSupport />} />
          <Route path="/dashboard/settings" element={<ClientSettings />} />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/emails" element={<AdminEmails />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;