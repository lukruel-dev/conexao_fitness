import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Dumbbell,
  Star,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listServices } from "@/services/services";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { formatBRL } from "@/lib/format";

export const FeaturedSpotlight: React.FC = () => {
  const { data: services, isLoading } = useQuery({
    queryKey: ["featured-services"],
    queryFn: () => listServices(),
    staleTime: 1000 * 60 * 3,
  });

  const allServices = services || [];
  const gymServices = allServices.filter((s) => s.providerType === "ACADEMIA").slice(0, 3);
  const proServices = allServices.filter((s) => s.providerType === "PERSONAL").slice(0, 3);

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
                  Academias & Estúdios
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Day Pass & Treinos
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Treine nas melhores academias parceiras credenciadas
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

        {/* CARDS DE ACADEMIAS REAIS */}
        {gymServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gymServices.map((gym) => (
              <div
                key={gym.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md"
              >
                <div className="relative h-36 w-full overflow-hidden bg-muted">
                  <img
                    src={
                      resolveMediaUrl(gym.providerAvatar) ||
                      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop"
                    }
                    alt={gym.providerName || gym.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm drop-shadow-sm leading-tight">
                        {gym.providerName || gym.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-white/90">
                        <MapPin className="h-3 w-3 text-primary" /> {gym.city || "Uruguaiana - RS"}
                      </div>
                    </div>
                    {gym.providerRating && (
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-400 border border-amber-400/20">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(gym.providerRating).toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {gym.description || `${gym.modality} • Treino de alta performance e estrutura completa`}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Valor
                      </span>
                      <span className="text-sm font-black text-primary">
                        {formatBRL(gym.price)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 text-xs font-semibold px-3 gap-1 shadow-sm"
                      asChild
                    >
                      <Link to={`/perfil/${gym.providerId || gym.id}`}>
                        Conhecer Academia & Planos
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center space-y-2.5 bg-card/40">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Nenhuma academia parceira cadastrada na sua região ainda
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              É proprietário de academia ou box funcional? Cadastre sua unidade no Conexão Fitness!
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs font-bold gap-1 mt-1" asChild>
              <Link to="/cadastro">
                Cadastrar Academia <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
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
                  Profissionais da Saúde & Fitness
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Verificados
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Personais, Nutricionistas e Fisioterapeutas credenciados
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

        {/* CARDS DE PROFISSIONAIS REAIS */}
        {proServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proServices.map((pro) => (
              <div
                key={pro.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md p-4"
              >
                <Link
                  to={`/perfil/${pro.providerId}`}
                  className="flex items-start gap-3 group/link hover:opacity-95 transition-opacity"
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        resolveMediaUrl(pro.providerAvatar) ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                      }
                      alt={pro.providerName || pro.name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30 group-hover/link:ring-primary transition-all"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground truncate group-hover/link:text-primary transition-colors">
                        {pro.providerName || pro.name}
                      </h3>
                      {pro.providerRating && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(pro.providerRating).toFixed(1)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-primary line-clamp-1">
                      {pro.professionTitle || pro.modality || "Personal Trainer"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {pro.city || "Uruguaiana - RS"}
                    </p>
                  </div>
                </Link>

                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {formatBRL(pro.price)} / sessão
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold px-3 gap-1 hover:bg-primary hover:text-white border-primary/30"
                    asChild
                  >
                    <Link to={`/perfil/${pro.providerId}`}>
                      <Calendar className="h-3 w-3" /> Ver Perfil
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center space-y-2.5 bg-card/40">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Dumbbell className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Descubra novos profissionais ou seja um credenciado
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Você é Personal Trainer, Nutricionista ou Fisioterapeuta? Crie sua conta e receba agendamentos online.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button size="sm" variant="default" className="h-7 text-xs font-bold gap-1" asChild>
                <Link to="/cadastro">
                  <UserPlus className="h-3.5 w-3.5" /> Criar Conta Profissional
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs font-bold gap-1" asChild>
                <Link to="/buscar?providerType=PERSONAL">
                  Buscar no Catálogo
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
