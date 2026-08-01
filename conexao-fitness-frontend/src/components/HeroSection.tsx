import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import heroImage from "@/assets/hero-gym.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[calc(5rem+max(24px,env(safe-area-inset-top)))] pb-[calc(5rem+max(16px,env(safe-area-inset-bottom)))]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Academia moderna"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 animate-fade-in">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Disponível em todo o Brasil
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Encontre seu{" "}
            <span className="gradient-text">treino ideal</span>{" "}
            onde você estiver
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            O marketplace que conecta você às melhores academias e profissionais do mundo fitness.
            Busque por localização, compare preços e agende direto pelo app.
          </p>

          {/* Search Bar */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3 border border-border shadow-card max-w-xl animate-fade-in-up mb-6 sm:mb-8" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 bg-muted rounded-xl">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  aria-label="Buscar por cidade ou CEP"
                  placeholder="Digite sua cidade ou CEP"
                  className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button variant="hero" size="lg" className="flex-shrink-0 text-sm sm:text-base h-11 sm:h-auto" asChild>
                <a href="/buscar">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Buscar</span>
                </a>
              </Button>
            </div>
          </div>

          {/* New Mobile-friendly CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-xl animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
             <Button variant="default" size="lg" className="w-full text-base sm:text-lg h-12 sm:h-14" asChild>
                <a href="/cadastro">Cadastrar agora</a>
             </Button>
             <Button variant="outline" size="lg" className="w-full text-base sm:text-lg h-12 sm:h-14" asChild>
                <a href="/login">Já tenho conta</a>
             </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 sm:mt-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-base">
                50+
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Academias parceiras</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs sm:text-base">
                100+
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Personal trainers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-xs sm:text-base">
                ⭐
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">4.9 avaliação média</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
