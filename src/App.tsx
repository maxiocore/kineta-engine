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
import TrackOrder from "./pages/TrackOrder";
import OurServices from "./pages/OurServices";
import CategoryDetails from "./pages/CategoryDetails";
import DevelopmentServices from "./pages/DevelopmentServices";
import DesignServices from "./pages/DesignServices";
import SocialMediaServices from "./pages/SocialMediaServices";
import DigitalMarketingServices from "./pages/DigitalMarketingServices";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Client Dashboard
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ClientOrders from "./pages/dashboard/ClientOrders";
import ClientOrderDetails from "./pages/dashboard/ClientOrderDetails";
import ClientRewardsHub from "./pages/dashboard/ClientRewardsHub";
import ClientNotifications from "./pages/dashboard/ClientNotifications";
import ClientSupport from "./pages/dashboard/ClientSupport";
import ClientSettings from "./pages/dashboard/ClientSettings";
import ClientAPI from "./pages/dashboard/ClientAPI";
import ClientDeposit from "./pages/dashboard/ClientDeposit";
import ClientDeposits from "./pages/dashboard/ClientDeposits";
import ClientFavorites from "./pages/dashboard/ClientFavorites";
import ClientServices from "./pages/dashboard/ClientServicesNew";
import SocialMediaServicesDashboard from "./pages/dashboard/SocialMediaServices";
import ClientReferrals from "./pages/dashboard/ClientReferrals";
// ClientRewards merged into ClientRewardsHub
import ClientBalanceLogs from "./pages/dashboard/ClientBalanceLogs";
import ClientDesignServices from "./pages/dashboard/ClientDesignServices";
import ClientDevServices from "./pages/dashboard/ClientDevServices";
import ClientDigitalServices from "./pages/dashboard/ClientDigitalServices";
import ClientServicesHome from "./pages/dashboard/ClientServicesHome";
import DesignServiceOrder from "./pages/dashboard/DesignServiceOrder";
import ClientCashback from "./pages/dashboard/ClientCashback";
import ClientChallenges from "./pages/dashboard/ClientChallenges";
import ClientFinancialHub from "./pages/dashboard/ClientFinancialHub";

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
import AdminOrdersSync from "./pages/admin/AdminOrdersSync";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminUserProfile from "./pages/admin/AdminUserProfile";
import AdminBadges from "./pages/admin/AdminBadges";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import AdminRefills from "./pages/admin/AdminRefills";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSocialCategories from "./pages/admin/AdminSocialCategories";
import AdminApiProviders from "./pages/admin/AdminApiProviders";
import AdminProviderReports from "./pages/admin/AdminProviderReports";
import AdminPriceComparison from "./pages/admin/AdminPriceComparison";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminRewards from "./pages/admin/AdminRewards";
import AdminRewardsReports from "./pages/admin/AdminRewardsReports";
import AdminWallets from "./pages/admin/AdminWallets";
import AdminCashback from "./pages/admin/AdminCashback";
import AdminBankWithdrawals from "./pages/admin/AdminBankWithdrawals";
import AdminFinancialHub from "./pages/admin/AdminFinancialHub";
import AdminUserSettings from "./pages/admin/AdminUserSettings";
import AdminFeaturedOffers from "./pages/admin/AdminFeaturedOffers";
import AdminTamaraPayments from "./pages/admin/AdminTamaraPayments";
import AdminPaymentsHub from "./pages/admin/AdminPaymentsHub";
import AdminChallenges from "./pages/admin/AdminChallenges";
import AdminSyncSettings from "./pages/admin/AdminSyncSettings";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import AdminDigitalMarketing from "./pages/admin/AdminDigitalMarketing";
import AdminCareers from "./pages/admin/AdminCareers";
import AdminFinancing from "./pages/admin/AdminFinancing";
import ClientFinancing from "./pages/dashboard/ClientFinancing";
import FinancingGuide from "./pages/dashboard/FinancingGuide";
import FinancingCalculator from "./pages/dashboard/FinancingCalculator";
import FinancingEligibility from "./pages/dashboard/FinancingEligibility";
import FinancingApply from "./pages/dashboard/FinancingApply";
import FinancingDocuments from "./pages/dashboard/FinancingDocuments";
import SignContract from "./pages/dashboard/SignContract";
import SignPromissoryNote from "./pages/dashboard/SignPromissoryNote";

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
                  <Route path="/our-services" element={<OurServices />} />
                  <Route path="/category/:slug" element={<CategoryDetails />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/development-services" element={<DevelopmentServices />} />
                  <Route path="/design-services" element={<DesignServices />} />
                  <Route path="/social-media-services" element={<SocialMediaServices />} />
                  <Route path="/digital-marketing-services" element={<DigitalMarketingServices />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
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
                  <Route path="/dashboard/orders/:orderId" element={
                    <ProtectedRoute>
                      <ClientOrderDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/badges" element={
                    <ProtectedRoute>
                      <ClientRewardsHub />
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
                  <Route path="/dashboard/api" element={
                    <ProtectedRoute>
                      <ClientAPI />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/deposit" element={
                    <ProtectedRoute>
                      <ClientDeposit />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/deposits" element={
                    <ProtectedRoute>
                      <ClientDeposits />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/favorites" element={
                    <ProtectedRoute>
                      <ClientFavorites />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/services" element={
                    <ProtectedRoute>
                      <ClientServices />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/referrals" element={
                    <ProtectedRoute>
                      <ClientReferrals />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/rewards" element={
                    <ProtectedRoute>
                      <ClientRewardsHub />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/balance-logs" element={
                    <ProtectedRoute>
                      <ClientBalanceLogs />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/design-services" element={
                    <ProtectedRoute>
                      <ClientDesignServices />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/dev-services" element={
                    <ProtectedRoute>
                      <ClientDevServices />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/our-services" element={
                    <ProtectedRoute>
                      <ClientServicesHome />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/digital-services" element={
                    <ProtectedRoute>
                      <ClientDigitalServices />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/social-services" element={
                    <ProtectedRoute>
                      <SocialMediaServicesDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/design-services/order" element={
                    <ProtectedRoute>
                      <DesignServiceOrder />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/cashback" element={
                    <ProtectedRoute>
                      <ClientCashback />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/challenges" element={
                    <ProtectedRoute>
                      <ClientChallenges />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financial" element={
                    <ProtectedRoute>
                      <ClientFinancialHub />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing" element={
                    <ProtectedRoute>
                      <ClientFinancing />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing/guide" element={
                    <ProtectedRoute>
                      <FinancingGuide />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing/calculator" element={
                    <ProtectedRoute>
                      <FinancingCalculator />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing/eligibility" element={
                    <ProtectedRoute>
                      <FinancingEligibility />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing/apply" element={
                    <ProtectedRoute>
                      <FinancingApply />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing/documents/:applicationId" element={
                    <ProtectedRoute>
                      <FinancingDocuments />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing/sign-contract/:applicationId" element={
                    <ProtectedRoute>
                      <SignContract />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financing/sign-promissory/:applicationId" element={
                    <ProtectedRoute>
                      <SignPromissoryNote />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Dashboard Routes */}
                  <Route path="/admin/auth" element={<AdminAuth />} />
                  <Route path="/admin/financial" element={
                    <ProtectedRoute requireAdmin>
                      <AdminFinancialHub />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/financing" element={
                    <ProtectedRoute requireAdmin>
                      <AdminFinancing />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/wallets" element={
                    <ProtectedRoute requireAdmin>
                      <AdminWallets />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/cashback" element={
                    <ProtectedRoute requireAdmin>
                      <AdminCashback />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/bank-withdrawals" element={
                    <ProtectedRoute requireAdmin>
                      <AdminBankWithdrawals />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/payments" element={
                    <ProtectedRoute requireAdmin>
                      <AdminPaymentMethods />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/payments-hub" element={
                    <ProtectedRoute requireAdmin>
                      <AdminPaymentsHub />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/refills" element={
                    <ProtectedRoute requireAdmin>
                      <AdminRefills />
                    </ProtectedRoute>
                  } />
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
                  <Route path="/admin/users/:userId" element={
                    <ProtectedRoute requireAdmin>
                      <AdminUserProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/services" element={
                    <ProtectedRoute requireAdmin>
                      <AdminServices />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/digital-marketing" element={
                    <ProtectedRoute requireAdmin>
                      <AdminDigitalMarketing />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/categories" element={
                    <ProtectedRoute requireAdmin>
                      <AdminCategories />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/providers" element={
                    <ProtectedRoute requireAdmin>
                      <AdminApiProviders />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/providers/reports" element={
                    <ProtectedRoute requireAdmin>
                      <AdminProviderReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/providers/compare" element={
                    <ProtectedRoute requireAdmin>
                      <AdminPriceComparison />
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
                  <Route path="/admin/orders/sync" element={
                    <ProtectedRoute requireAdmin>
                      <AdminOrdersSync />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/referrals" element={
                    <ProtectedRoute requireAdmin>
                      <AdminReferrals />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/coupons" element={
                    <ProtectedRoute requireAdmin>
                      <AdminCoupons />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/badges" element={
                    <ProtectedRoute requireAdmin>
                      <AdminBadges />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/rewards" element={
                    <ProtectedRoute requireAdmin>
                      <AdminRewards />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/challenges" element={
                    <ProtectedRoute requireAdmin>
                      <AdminChallenges />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/rewards/reports" element={
                    <ProtectedRoute requireAdmin>
                      <AdminRewardsReports />
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
                  <Route path="/admin/contact-messages" element={
                    <ProtectedRoute requireAdmin>
                      <AdminContactMessages />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/careers" element={
                    <ProtectedRoute requireAdmin>
                      <AdminCareers />
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
                  <Route path="/admin/user-settings" element={
                    <ProtectedRoute requireAdmin>
                      <AdminUserSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/featured-offers" element={
                    <ProtectedRoute requireAdmin>
                      <AdminFeaturedOffers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/tamara-payments" element={
                    <ProtectedRoute requireAdmin>
                      <AdminTamaraPayments />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/sync-settings" element={
                    <ProtectedRoute requireAdmin>
                      <AdminSyncSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/social-categories" element={
                    <ProtectedRoute requireAdmin>
                      <AdminSocialCategories />
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
