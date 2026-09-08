import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Dumbbell,
  Star,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GymFeatured {
  id: string;
  name: string;
  tagline: string;
  location: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  dayPassPrice: string;
  features: string[];
}

interface ProfessionalFeatured {
  id: string;
  name: string;
  roleTitle: string;
  cref: string;
  location: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  hourlyPrice: string;
  specialties: string[];
}

const FEATURED_GYMS: GymFeatured[] = [
  {
    id: "gym-1",
    name: "Academia Conexão VIP",
    tagline: "Musculação, Cardio Climatizado & Vestiários Premium",
    location: "Centro • Uruguaiana - RS",
    rating: 4.9,
    reviewsCount: 128,
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop",
    dayPassPrice: "R$ 25,00",
    features: ["Climatizado", "Biomecânica", "Vestiário"],
  },
  {
    id: "gym-2",
    name: "Iron Box CrossFit & Performance",
    tagline: "Boxes de Cross Training, LPO e Treino Funcional",
    location: "São Miguel • Uruguaiana - RS",
    rating: 4.8,
    reviewsCount: 94,
    imageUrl:
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop",
    dayPassPrice: "R$ 35,00",
    features: ["WOD", "LPO", "Coach Dedicado"],
  },
  {
    id: "gym-3",
    name: "Studio Pilates & Movimento Vital",
    tagline: "Pilates Clínico em Aparelhos & Reeducação Postural",
    location: "Bela Vista • Porto Alegre - RS",
    rating: 5.0,
    reviewsCount: 76,
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop",
    dayPassPrice: "R$ 45,00",
    features: ["Reformer", "Cadillac", "Avaliação"],
  },
];

const FEATURED_PROS: ProfessionalFeatured[] = [
  {
    id: "pro-1",
    name: "Prof. Diego Silva",
    roleTitle: "Personal Trainer & Preparador Físico",
    cref: "CREF 012345-G/RS",
    location: "Uruguaiana - RS (Presencial e Online)",
    rating: 4.9,
    reviewsCount: 48,
    imageUrl:
      "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop",
    hourlyPrice: "R$ 75,00 / sessão",
    specialties: ["Musculação", "Hipertrofia", "Consultoria"],
  },
  {
    id: "pro-2",
    name: "Dra. Camila Santos",
    roleTitle: "Nutricionista Esportiva & Clínica",
    cref: "CRN 98765/RS",
    location: "Uruguaiana - RS (Consultório e Online)",
    rating: 5.0,
    reviewsCount: 32,
    imageUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop",
    hourlyPrice: "R$ 140,00 / consulta",
    specialties: ["Bioimpedância", "Emagrecimento", "Suplementação"],
  },
  {
    id: "pro-3",
    name: "Dr. Rodrigo Oliveira",
    roleTitle: "Fisioterapeuta Desportivo & Osteopata",
    cref: "CREFITO 54321/RS",
    location: "Uruguaiana - RS",
    rating: 4.9,
    reviewsCount: 29,
    imageUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop",
    hourlyPrice: "R$ 130,00 / sessão",
    specialties: ["Reabilitação", "Liberação Miofascial", "Ventosaterapia"],
  },
];

export const FeaturedSpotlight: React.FC = () => {
  return (
    <div className="space-y-8 mb-8">
      {/* SEÇÃO 1: ACADEMIAS EM DESTAQUE */}
      <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 border border-primary/20 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Academias em Destaque
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Day Pass Disponível
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Treine nas melhores academias e estúdios parceiros sem mensalidade fixa
              </p>
            </div>
          </div>
          <Link
            to="/buscar?providerType=ACADEMIA"
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            Ver todas <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* CARDS DE ACADEMIAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURED_GYMS.map((gym) => (
            <div
              key={gym.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md"
            >
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                <img
                  src={gym.imageUrl}
                  alt={gym.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm drop-shadow-sm leading-tight">
                      {gym.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-white/90">
                      <MapPin className="h-3 w-3 text-primary" /> {gym.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-400 border border-amber-400/20">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {gym.rating.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {gym.tagline}
                </p>

                <div className="flex flex-wrap gap-1">
                  {gym.features.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-foreground/80 font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      A partir de
                    </span>
                    <span className="text-sm font-black text-primary">
                      {gym.dayPassPrice}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold px-3 gap-1 shadow-sm"
                    asChild
                  >
                    <Link to="/buscar?providerType=ACADEMIA">
                      Garantir Day Pass
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 2: PROFISSIONAIS EM DESTAQUE */}
      <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 border border-primary/20 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Profissionais em Destaque
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Verificados
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Personais, Nutricionistas e Fisioterapeutas avaliados pela comunidade
              </p>
            </div>
          </div>
          <Link
            to="/buscar?providerType=PERSONAL"
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            Ver todos <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* CARDS DE PROFISSIONAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURED_PROS.map((pro) => (
            <div
              key={pro.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md p-4"
            >
              <Link
                to={`/perfil/${pro.id}`}
                className="flex items-start gap-3 group/link hover:opacity-95 transition-opacity"
              >
                <div className="relative">
                  <img
                    src={pro.imageUrl}
                    alt={pro.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30 group-hover/link:ring-primary transition-all"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground truncate group-hover/link:text-primary transition-colors">
                      {pro.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {pro.rating.toFixed(1)}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-primary line-clamp-1">
                    {pro.roleTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {pro.cref}
                  </p>
                </div>
              </Link>

              <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  {pro.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-foreground/80 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-foreground">
                    {pro.hourlyPrice}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold px-3 gap-1 hover:bg-primary hover:text-white border-primary/30"
                    asChild
                  >
                    <Link to="/buscar?providerType=PERSONAL">
                      <Calendar className="h-3 w-3" /> Agendar
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
