import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ForStudentsSection from "@/components/ForStudentsSection";
import ForProfessionalsSection from "@/components/ForProfessionalsSection";
import PlansSection from "@/components/PlansSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    // wait for sections to mount
    const tryScroll = (attempt = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempt < 10) {
        setTimeout(() => tryScroll(attempt + 1), 50);
      }
    };
    tryScroll();
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <ForStudentsSection />
        <ForProfessionalsSection />
        <PlansSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
