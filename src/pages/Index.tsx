import { lazy, Suspense } from "react";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import Footer from "@/components/landing/Footer";
import MobileBottomNav from "@/components/landing/MobileBottomNav";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load non-critical sections for faster initial page load
const TrustedBySection = lazy(() => import("@/components/landing/TrustedBySection"));
const ServicesSection = lazy(() => import("@/components/landing/ServicesSection"));
const WhyUsSection = lazy(() => import("@/components/landing/WhyUsSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));

// Loading skeleton for sections
const SectionSkeleton = () => (
  <div className="py-12 sm:py-16">
    <div className="container px-4">
      <div className="text-center mb-8">
        <Skeleton className="h-6 w-32 mx-auto mb-3" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header - hidden on mobile, shown on desktop */}
      <div className="hidden lg:block">
        <Header />
      </div>
      
      {/* Mobile App Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <span 
            className="text-lg font-bold bg-gradient-to-l from-primary to-violet-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            MaxioCore
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium text-green-600 dark:text-green-400">متصل</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-20 lg:pb-0">
        {/* Hero - loads immediately */}
        <HeroSection />
        
        {/* Lazy loaded sections */}
        <Suspense fallback={<SectionSkeleton />}>
          <TrustedBySection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <section id="services">
            <ServicesSection />
          </section>
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <WhyUsSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <section id="how-it-works">
            <HowItWorksSection />
          </section>
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection />
        </Suspense>
      </main>
      
      {/* Footer - only on desktop */}
      <div className="hidden lg:block">
        <Footer />
      </div>
      
      {/* Mobile Footer */}
      <footer className="lg:hidden py-6 px-4 pb-24 bg-muted/30 border-t border-border/30">
        <div className="text-center space-y-3">
          <span 
            className="text-lg font-bold bg-gradient-to-l from-primary to-violet-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            MaxioCore
          </span>
          <p className="text-xs text-muted-foreground">
            © 2024 MaxioCore. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Index;
