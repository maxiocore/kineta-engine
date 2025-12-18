import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MaintenanceProvider } from "@/hooks/useMaintenanceMode";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";

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
import AdminSupport from "./pages/admin/AdminSupport";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminServiceImport from "./pages/admin/AdminServiceImport";
import AdminPriceUpdate from "./pages/admin/AdminPriceUpdate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <MaintenanceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <MaintenanceGuard>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Client Dashboard Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <ClientDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/orders" element={
                    <ProtectedRoute>
                      <ClientOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/notifications" element={
                    <ProtectedRoute>
                      <ClientNotifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/support" element={
                    <ProtectedRoute>
                      <ClientSupport />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/settings" element={
                    <ProtectedRoute>
                      <ClientSettings />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Dashboard Routes */}
                  <Route path="/admin/auth" element={<AdminAuth />} />
                  <Route path="/admin" element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute requireAdmin>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/services" element={
                    <ProtectedRoute requireAdmin>
                      <AdminServices />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/services/import" element={
                    <ProtectedRoute requireAdmin>
                      <AdminServiceImport />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/services/prices" element={
                    <ProtectedRoute requireAdmin>
                      <AdminPriceUpdate />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/orders" element={
                    <ProtectedRoute requireAdmin>
                      <AdminOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/emails" element={
                    <ProtectedRoute requireAdmin>
                      <AdminEmails />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/notifications" element={
                    <ProtectedRoute requireAdmin>
                      <AdminNotifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/logs" element={
                    <ProtectedRoute requireAdmin>
                      <AdminLogs />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/support" element={
                    <ProtectedRoute requireAdmin>
                      <AdminSupport />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <ProtectedRoute requireAdmin>
                      <AdminReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <ProtectedRoute requireAdmin>
                      <AdminSettings />
                    </ProtectedRoute>
                  } />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MaintenanceGuard>
            </BrowserRouter>
          </TooltipProvider>
        </MaintenanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
