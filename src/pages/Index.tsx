import { lazy, Suspense } from "react";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import Footer from "@/components/landing/Footer";
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
  <div className="py-16 sm:py-24">
    <div className="container px-4 sm:px-6">
      <div className="text-center mb-12">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main>
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
      <Footer />
    </div>
  );
};

export default Index;
