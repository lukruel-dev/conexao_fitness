import { Button } from "@/components/ui/button";
import { MapPin, Search, Star } from "lucide-react";
import heroImage from "@/assets/hero-gym.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const featuredAcademies = [
  { id: 1, name: "FitLife Gym", desc: "Equipamentos de Ponta", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop" },
  { id: 2, name: "PowerHouse Center", desc: "Aulas Exclusivas", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=400&auto=format&fit=crop" },
  { id: 3, name: "Zenith Yoga & Pilates", desc: "Aulas Exclusivas", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop" },
  { id: 4, name: "Iron Forge Fitness", desc: "Aulas Exclusivas", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop" },
  { id: 5, name: "Apex Athletics", desc: "Aulas Exclusivas", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=400&auto=format&fit=crop" },
];

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
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Conheça Nossas <span className="gradient-text">Academias Parceiras</span> de Destaque
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            O marketplace que conecta você às melhores academias e profissionais.
            Busque por localização, compare preços e agende direto pelo app.
          </p>

          {/* Featured Academies Carousel */}
          <div className="w-full max-w-full mb-8 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredAcademies.map((academy) => (
                  <CarouselItem key={academy.id} className="pl-2 md:pl-4 basis-[80%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <div className="relative group overflow-hidden rounded-2xl border border-white/10 aspect-[4/3]">
                      <img src={academy.image} alt={academy.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-white font-semibold text-lg leading-tight">{academy.name}</h3>
                        <p className="text-white/70 text-sm">{academy.desc}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4 bg-background/50 backdrop-blur-md border-white/20 hover:bg-background/80 text-white" />
              <CarouselNext className="hidden sm:flex -right-4 bg-background/50 backdrop-blur-md border-white/20 hover:bg-background/80 text-white" />
            </Carousel>
          </div>

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
