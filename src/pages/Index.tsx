import { lazy, Suspense } from "react";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";

const ServicesSection = lazy(() => import("@/components/landing/ServicesSection"));
const WhyUsSection = lazy(() => import("@/components/landing/WhyUsSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const FinancingSection = lazy(() => import("@/components/landing/FinancingSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const CompanyProfileSection = lazy(() => import("@/components/landing/CompanyProfileSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const Footer = lazy(() => import("@/components/landing/Footer"));

const SectionFallback = () => (
  <div className="py-16 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <Suspense fallback={<SectionFallback />}>
          <section id="services">
            <ServicesSection />
          </section>
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <WhyUsSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <section id="how-it-works">
            <HowItWorksSection />
          </section>
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FinancingSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <TestimonialsSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <CompanyProfileSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FAQSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <CTASection />
        </Suspense>
      </main>
      <Suspense fallback={<SectionFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
