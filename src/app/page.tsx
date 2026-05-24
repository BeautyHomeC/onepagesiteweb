import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import GoogleRatingBadge from "@/components/GoogleRatingBadge";
import AboutSection from "@/components/AboutSection";
import FormationsSection from "@/components/FormationsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-[100px] pb-24 md:pb-0">
        <HeroSection />
        <div className="py-4 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto border-b border-outline-variant/20 flex items-center gap-4">
          <GoogleRatingBadge />
        </div>
        <AboutSection />
        <FormationsSection />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
