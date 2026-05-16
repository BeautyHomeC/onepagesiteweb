import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsStrip from "@/components/StatsStrip";
import AboutSection from "@/components/AboutSection";
import FormationsSection from "@/components/FormationsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FaqSection from "@/components/FaqSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-[88px]">
        <HeroSection />
        <StatsStrip />
        <AboutSection />
        <FormationsSection />
        <TestimonialsSection />
        <FaqSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
