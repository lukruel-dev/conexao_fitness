import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlansSection from "@/components/PlansSection";

export default function Planos() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <PlansSection />
      </main>
      <Footer />
    </div>
  );
}
