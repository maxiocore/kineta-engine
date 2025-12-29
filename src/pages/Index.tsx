import { lazy, Suspense } from "react";
import Header from "@/components/landing/Header";
import NewHeroSection from "@/components/landing/NewHeroSection";
import NewFooter from "@/components/landing/NewFooter";
import NewMobileBottomNav from "@/components/landing/NewMobileBottomNav";
import MobileHeader from "@/components/landing/MobileHeader";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load sections
const AboutSection = lazy(() => import("@/components/landing/AboutSection"));
const NewServicesSection = lazy(() => import("@/components/landing/NewServicesSection"));
const WhyChooseUsSection = lazy(() => import("@/components/landing/WhyChooseUsSection"));
const PortfolioSection = lazy(() => import("@/components/landing/PortfolioSection"));
const NewTestimonialsSection = lazy(() => import("@/components/landing/NewTestimonialsSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));

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
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <Header />
      </div>
      
      {/* Mobile Header */}
      <MobileHeader />

      <main className="pb-20 lg:pb-0">
        <NewHeroSection />
        
        <Suspense fallback={<SectionSkeleton />}>
          <AboutSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <NewServicesSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <WhyChooseUsSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <PortfolioSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <NewTestimonialsSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <CTASection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection />
        </Suspense>
      </main>
      
      {/* Footer */}
      <div className="hidden lg:block">
        <NewFooter />
      </div>
      
      {/* Mobile Footer */}
      <footer className="lg:hidden py-6 px-4 pb-24 bg-muted/30 border-t border-border/30">
        <div className="text-center space-y-3">
          <span className="text-lg font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
            MaxioCore
          </span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
      
      <NewMobileBottomNav />
    </div>
  );
};

export default Index;
