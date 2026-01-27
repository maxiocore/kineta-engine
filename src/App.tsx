import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MaintenanceProvider } from "@/hooks/useMaintenanceMode";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import ScrollToTop from "@/components/ScrollToTop";
import NotificationListener from "@/components/pwa/NotificationListener";
import NotificationPermissionPrompt from "@/components/pwa/NotificationPermissionPrompt";
import { InAppNotificationContainer } from "@/components/pwa/InAppNotification";
import PageLoader from "@/components/ui/PageLoader";

// Lazy load pages - Public pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Pricing = lazy(() => import("./pages/Pricing"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const OurServices = lazy(() => import("./pages/OurServices"));
const DevelopmentServices = lazy(() => import("./pages/DevelopmentServices"));
const DesignServices = lazy(() => import("./pages/DesignServices"));
const Careers = lazy(() => import("./pages/Careers"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const PaymentPolicy = lazy(() => import("./pages/PaymentPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const FinancingInfo = lazy(() => import("./pages/FinancingInfo"));

// Lazy load pages - Developers
const GettingStarted = lazy(() => import("./pages/developers/GettingStarted"));
const ApiReference = lazy(() => import("./pages/developers/ApiReference"));
const CodeExamples = lazy(() => import("./pages/developers/CodeExamples"));
const SdkDownloads = lazy(() => import("./pages/developers/SdkDownloads"));

// Lazy load pages - Client Dashboard
const NotificationOnboarding = lazy(() => import("@/pages/dashboard/NotificationOnboarding"));
const ClientDashboard = lazy(() => import("./pages/dashboard/ClientDashboard"));
const ClientOrders = lazy(() => import("./pages/dashboard/ClientOrders"));
const ClientOrderDetails = lazy(() => import("./pages/dashboard/ClientOrderDetails"));
const ClientRewardsHub = lazy(() => import("./pages/dashboard/ClientRewardsHub"));
const ClientNotifications = lazy(() => import("./pages/dashboard/ClientNotifications"));
const ClientSupport = lazy(() => import("./pages/dashboard/ClientSupport"));
const ClientSettings = lazy(() => import("./pages/dashboard/ClientSettings"));
const ClientAPI = lazy(() => import("./pages/dashboard/ClientAPI"));
const ClientDeposit = lazy(() => import("./pages/dashboard/ClientDeposit"));
const ClientDeposits = lazy(() => import("./pages/dashboard/ClientDeposits"));
const ClientFavorites = lazy(() => import("./pages/dashboard/ClientFavorites"));
const ClientReferrals = lazy(() => import("./pages/dashboard/ClientReferrals"));
const ClientBalanceLogs = lazy(() => import("./pages/dashboard/ClientBalanceLogs"));
const ClientDesignServices = lazy(() => import("./pages/dashboard/ClientDesignServices"));
const ClientMarketingServices = lazy(() => import("./pages/dashboard/ClientMarketingServices"));
const ClientServicesHome = lazy(() => import("./pages/dashboard/ClientServicesHome"));
const DesignServiceOrder = lazy(() => import("./pages/dashboard/DesignServiceOrder"));
const ClientCashback = lazy(() => import("./pages/dashboard/ClientCashback"));
const ClientChallenges = lazy(() => import("./pages/dashboard/ClientChallenges"));
const ClientFinancialHub = lazy(() => import("./pages/dashboard/ClientFinancialHub"));

// Lazy load pages - Financing
const ClientFinancing = lazy(() => import("./pages/dashboard/ClientFinancing"));
const FinancingGuide = lazy(() => import("./pages/dashboard/FinancingGuide"));
const FinancingCalculator = lazy(() => import("./pages/dashboard/FinancingCalculator"));
const FinancingEligibility = lazy(() => import("./pages/dashboard/FinancingEligibility"));
const FinancingApply = lazy(() => import("./pages/dashboard/FinancingApply"));
const FinancingDocuments = lazy(() => import("./pages/dashboard/FinancingDocuments"));
const SignContract = lazy(() => import("./pages/dashboard/SignContract"));
// SignPromissoryNote removed - الكمبيالة محذوفة نهائياً
const FinancingPayment = lazy(() => import("./pages/dashboard/FinancingPayment"));
const ClientFinancingPayments = lazy(() => import("./pages/dashboard/ClientFinancingPayments"));
const FinancingStatus = lazy(() => import("./pages/dashboard/FinancingStatus"));
const UnifiedFinancingStatus = lazy(() => import("./pages/dashboard/UnifiedFinancingStatus"));
const FinancingV2 = lazy(() => import("./pages/dashboard/FinancingV2"));

// Lazy load pages - Dev Services
const DevServicesPage = lazy(() => import("./pages/dashboard/DevServicesPage"));
const DevServiceDetails = lazy(() => import("./pages/dashboard/DevServiceDetails"));
const DevOrderWizard = lazy(() => import("./pages/dashboard/DevOrderWizard"));
const MyDevOrders = lazy(() => import("./pages/dashboard/MyDevOrders"));
const DevOrderDetails = lazy(() => import("./pages/dashboard/DevOrderDetails"));
const VerifyEmailPage = lazy(() => import("./pages/dashboard/VerifyEmailPage"));

// Lazy load pages - Unified Orders
const UnifiedOrders = lazy(() => import("./pages/dashboard/UnifiedOrders"));
const UnifiedOrderDetails = lazy(() => import("./pages/dashboard/UnifiedOrderDetails"));

// Lazy load pages - Admin Dashboard
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminAppNotifications = lazy(() => import("./pages/admin/AdminAppNotifications"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminAuth = lazy(() => import("./pages/admin/AdminAuth"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminUserProfile = lazy(() => import("./pages/admin/AdminUserProfile"));
const AdminBadges = lazy(() => import("./pages/admin/AdminBadges"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/AdminPaymentMethods"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminRewards = lazy(() => import("./pages/admin/AdminRewards"));
const AdminRewardsReports = lazy(() => import("./pages/admin/AdminRewardsReports"));
const AdminWallets = lazy(() => import("./pages/admin/AdminWallets"));
const AdminCashback = lazy(() => import("./pages/admin/AdminCashback"));
const AdminBankWithdrawals = lazy(() => import("./pages/admin/AdminBankWithdrawals"));
const AdminFinancialHub = lazy(() => import("./pages/admin/AdminFinancialHub"));
const AdminUserSettings = lazy(() => import("./pages/admin/AdminUserSettings"));
const AdminFeaturedOffers = lazy(() => import("./pages/admin/AdminFeaturedOffers"));
const AdminTamaraPayments = lazy(() => import("./pages/admin/AdminTamaraPayments"));
const AdminPaymentsHub = lazy(() => import("./pages/admin/AdminPaymentsHub"));
const AdminChallenges = lazy(() => import("./pages/admin/AdminChallenges"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminCareers = lazy(() => import("./pages/admin/AdminCareers"));
const AdminFinancing = lazy(() => import("./pages/admin/AdminFinancing"));
const AdminDevOrders = lazy(() => import("./pages/admin/AdminDevOrders"));
const AdminDevOrderDetails = lazy(() => import("./pages/admin/AdminDevOrderDetails"));
const AdminUnifiedOrders = lazy(() => import("./pages/admin/AdminUnifiedOrders"));
const AdminOrderDetails = lazy(() => import("./pages/admin/AdminOrderDetails"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <MaintenanceProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NotificationListener />
              <NotificationPermissionPrompt variant="banner" />
              <InAppNotificationContainer />
              <ScrollToTop />
              <MaintenanceGuard>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/our-services" element={<Navigate to="/services" replace />} />
                    <Route path="/services" element={<OurServices />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/development-services" element={<DevelopmentServices />} />
                    <Route path="/design-services" element={<DesignServices />} />
                    
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/payment-methods" element={<PaymentMethods />} />
                    <Route path="/payment-policy" element={<PaymentPolicy />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/financing" element={<FinancingInfo />} />
                    <Route path="/developers/getting-started" element={<GettingStarted />} />
                    <Route path="/developers/api-reference" element={<ApiReference />} />
                    <Route path="/developers/examples" element={<CodeExamples />} />
                    <Route path="/developers/sdk" element={<SdkDownloads />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    
                    {/* Client Dashboard Routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <ClientDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/orders" element={
                      <ProtectedRoute>
                        <UnifiedOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/orders/:orderId" element={
                      <ProtectedRoute>
                        <UnifiedOrderDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/smm-orders" element={
                      <ProtectedRoute>
                        <ClientOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/smm-orders/:orderId" element={
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
                    <Route path="/dashboard/notification-setup" element={
                      <ProtectedRoute>
                        <NotificationOnboarding />
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
                        <ClientServicesHome />
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
                        <DevServicesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/marketing-services" element={
                      <ProtectedRoute>
                        <ClientMarketingServices />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/our-services" element={
                      <ProtectedRoute>
                        <ClientServicesHome />
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
                        <FinancingV2 />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/financing/legacy" element={
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
                    {/* Promissory note route removed - الكمبيالة محذوفة نهائياً */}
                    <Route path="/dashboard/financing/payment" element={
                      <ProtectedRoute>
                        <FinancingPayment />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/financing/payments" element={
                      <ProtectedRoute>
                        <ClientFinancingPayments />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/financing/status/:applicationId" element={
                      <ProtectedRoute>
                        <FinancingStatus />
                      </ProtectedRoute>
                    } />
                    {/* Unified Status Page with Deep Link Support */}
                    <Route path="/financing/status/:applicationId" element={
                      <ProtectedRoute>
                        <UnifiedFinancingStatus />
                      </ProtectedRoute>
                    } />
                    
                    {/* Dev Services Routes */}
                    <Route path="/dashboard/dev-services/:slug" element={
                      <ProtectedRoute>
                        <DevServiceDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/dev-services/order/:serviceId" element={
                      <ProtectedRoute>
                        <DevOrderWizard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/my-dev-orders" element={
                      <ProtectedRoute>
                        <MyDevOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/my-dev-orders/:orderId" element={
                      <ProtectedRoute>
                        <DevOrderDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/verify-email" element={
                      <ProtectedRoute>
                        <VerifyEmailPage />
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
                    <Route path="/admin/orders" element={
                      <ProtectedRoute requireAdmin>
                        <AdminUnifiedOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/orders/:orderId" element={
                      <ProtectedRoute requireAdmin>
                        <AdminOrderDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/smm-orders" element={
                      <ProtectedRoute requireAdmin>
                        <AdminOrders />
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
                    <Route path="/admin/app-notifications" element={
                      <ProtectedRoute requireAdmin>
                        <AdminAppNotifications />
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
                    <Route path="/admin/payment-methods" element={
                      <ProtectedRoute requireAdmin>
                        <AdminPaymentMethods />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/referrals" element={
                      <ProtectedRoute requireAdmin>
                        <AdminReferrals />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/rewards" element={
                      <ProtectedRoute requireAdmin>
                        <AdminRewards />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/rewards-reports" element={
                      <ProtectedRoute requireAdmin>
                        <AdminRewardsReports />
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
                    <Route path="/admin/financial" element={
                      <ProtectedRoute requireAdmin>
                        <AdminFinancialHub />
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
                    <Route path="/admin/payments" element={
                      <ProtectedRoute requireAdmin>
                        <AdminPaymentsHub />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/challenges" element={
                      <ProtectedRoute requireAdmin>
                        <AdminChallenges />
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
                    <Route path="/admin/financing" element={
                      <ProtectedRoute requireAdmin>
                        <AdminFinancing />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/dev-orders" element={
                      <ProtectedRoute requireAdmin>
                        <AdminDevOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/dev-orders/:orderId" element={
                      <ProtectedRoute requireAdmin>
                        <AdminDevOrderDetails />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </MaintenanceGuard>
            </TooltipProvider>
          </MaintenanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
