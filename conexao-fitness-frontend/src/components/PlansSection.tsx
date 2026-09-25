import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  CreditCard,
  Building2,
  Dumbbell,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { StripeSubscriptionModal } from "./StripeSubscriptionModal";
import { openGuestLoginModal } from "./GuestLoginInductionModal";
import { confirmSaaSSubscription } from "@/services/payments";

interface PlanItem {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  cta: string;
  priceId?: string;
}

const userPlans: PlanItem[] = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Acesso básico ao ecossistema",
    features: [
      "Busca de profissionais",
      "Reserva de aulas avulsas",
      "Visualização de conteúdos públicos",
    ],
    highlight: false,
    cta: "Começar Grátis",
  },
  {
    name: "Start",
    price: "R$ 99,90",
    period: "/mês",
    description: "Ideal para começar sua rotina",
    priceId: "price_1UJJ4bR8Zsp2ACDID6CShQkQ",
    features: [
      "~6 treinos (R$15)",
      "~3 treinos (R$30)",
      "Acesso a conteúdos exclusivos",
      "Agendamento prioritário",
    ],
    highlight: false,
    cta: "Assinar Start",
  },
  {
    name: "Plus",
    price: "R$ 179,90",
    period: "/mês",
    description: "Para quem quer mais opções",
    priceId: "price_1UJJ4bR8Zsp2ACDIlxaxOjef",
    features: [
      "~10 treinos (R$15)",
      "~5 treinos (R$30)",
      "Descontos em parceiros",
      "Acesso multi-academias",
    ],
    highlight: true,
    cta: "Assinar Plus",
  },
  {
    name: "Premium",
    price: "R$ 299,90",
    period: "/mês",
    description: "Acesso ilimitado e premium",
    priceId: "price_1UJJTFR8Zsp2ACDItynCjM5C",
    features: [
      "~18 treinos (R$15)",
      "~9 treinos (R$30)",
      "Suporte VIP 24/7",
      "Ficha de treino digitalizada",
    ],
    highlight: false,
    cta: "Assinar Premium",
  },
];

const personalPlans: PlanItem[] = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para quem está começando",
    features: [
      "Taxa de intermediação de 12%",
      "Perfil listado no catálogo",
      "Agenda básica",
    ],
    highlight: false,
    cta: "Começar Grátis",
  },
  {
    name: "Start",
    price: "R$ 49,90",
    period: "/mês",
    description: "Fluidez, constância, equilíbrio",
    priceId: "price_1UJJ4XR8Zsp2ACDI97eyRHAb",
    features: [
      "Taxa de intermediação de 10%",
      "Perfil verificado",
      "Até 10 leads/mês",
      "Relatórios básicos de alunos",
    ],
    highlight: false,
    cta: "Assinar Start",
  },
  {
    name: "Pro",
    price: "R$ 149,90",
    period: "/mês",
    description: "Consistência, estilo próprio",
    priceId: "price_1UJJ4YR8Zsp2ACDIerF6xq6u",
    features: [
      "Taxa de intermediação reduzida para 8%",
      "Leads ilimitados",
      "Destaque nas buscas e mapa",
      "Histórico de evolução de alunos",
    ],
    highlight: true,
    cta: "Assinar Pro",
  },
  {
    name: "Elite",
    price: "R$ 299,90",
    period: "/mês",
    description: "Experiência completa com Ferramentas Inteligentes",
    priceId: "price_1UJJ4YR8Zsp2ACDIcMJgEK0f",
    features: [
      "✨ Prescritor Inteligente de Treinos & Dietas",
      "📲 Envio Direto para o App do Aluno",
      "Menor taxa de intermediação: apenas 6%",
      "Prioridade máxima nas buscas",
      "Página personalizada e suporte prioritário",
    ],
    highlight: false,
    cta: "Assinar Elite",
  },
];

const gymPlans: PlanItem[] = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para conhecer a plataforma",
    features: [
      "Acesso básico",
      "Perfil listado no marketplace",
      "Divulgação de endereço e fotos",
    ],
    highlight: false,
    cta: "Começar Grátis",
  },
  {
    name: "Essencial",
    price: "R$ 99,90",
    period: "/mês",
    description: "Sistema de Matrícula & Catraca Digital",
    priceId: "price_1UJJ4ZR8Zsp2ACDIwKQtzTIj",
    features: [
      "Taxa de intermediação de 10%",
      "Matrícula Online de Alunos",
      "Catraca Digital com QR Code",
      "Gerenciamento de Matrículas",
      "Perfil Verificado com Selo",
      "Day Pass Digital",
    ],
    highlight: false,
    cta: "Assinar Essencial",
  },
  {
    name: "Destaque",
    price: "R$ 249,90",
    period: "/mês",
    description: "Para atrair mais alunos e crescer",
    priceId: "price_1UJJ4ZR8Zsp2ACDINeUO38V3",
    features: [
      "Taxa de intermediação reduzida para 8%",
      "Tudo do Essencial",
      "Melhor posicionamento em buscas",
      "Relatórios avançados de acessos",
      "Selo de Destaque Regional",
      "Alunos ilimitados",
    ],
    highlight: true,
    cta: "Assinar Destaque",
  },
  {
    name: "Elite",
    price: "R$ 449,90",
    period: "/mês",
    description: "Para grandes academias e redes",
    priceId: "price_1UJJ4aR8Zsp2ACDIy4WDUp8T",
    features: [
      "Menor taxa de intermediação: apenas 6%",
      "Tudo do Destaque",
      "Prioridade máxima no ranking",
      "API de integração com catracas físicas",
      "Suporte VIP dedicado 24/7",
    ],
    highlight: false,
    cta: "Assinar Elite",
  },
];


const PlansSection = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();

  const [selectedPlanForStripe, setSelectedPlanForStripe] = useState<{
    name: string;
    price: string;
    period?: string;
    description?: string;
    features?: string[];
    priceId?: string;
    roleCategory?: "STUDENT" | "PERSONAL" | "ACADEMIA";
  } | null>(null);

  const handlePlanAction = (plan: PlanItem, roleCategory: "STUDENT" | "PERSONAL" | "ACADEMIA") => {
    if (!isAuthenticated) {
      openGuestLoginModal(`Faça login ou crie sua conta gratuita para assinar o plano ${plan.name} e desbloquear todos os recursos.`);
      return;
    }

    if (plan.name === "Gratuito") {
      try {
        confirmSaaSSubscription("Gratuito");
      } catch (e) {}
      if (user) {
        setUser({ ...user, plan: "Gratuito", planName: "Gratuito" } as any);
      }
      localStorage.setItem("cf_user_plan", "Gratuito");
      toast.success("Plano Gratuito ativo!", {
        description: "Você está utilizando a versão básica do Finex.",
      });
      return;
    }

    setSelectedPlanForStripe({
      name: plan.name,
      price: plan.price,
      period: plan.period,
      description: plan.description,
      features: plan.features,
      priceId: plan.priceId,
      roleCategory,
    });
  };

  const isCurrentPlan = (planName: string, roleCategory: "STUDENT" | "PERSONAL" | "ACADEMIA") => {
    if (!isAuthenticated || !user) return false;
    const currentPlanName =
      (user as any).planName ||
      (user as any).plan ||
      localStorage.getItem("cf_user_plan") ||
      "Gratuito";
    if (user.role === roleCategory && currentPlanName.toLowerCase() === planName.toLowerCase()) {
      return true;
    }
    return false;
  };

  const normalizedRole = isAuthenticated && user?.role ? String(user.role).toUpperCase() : null;
  const isPersonal = normalizedRole === "PERSONAL";
  const isAcademia = normalizedRole === "ACADEMIA";
  const isStudent = normalizedRole === "STUDENT";
  const isAdmin = normalizedRole === "ADMIN";

  const [visitorFilter, setVisitorFilter] = useState<"ALL" | "STUDENT" | "PERSONAL" | "ACADEMIA">("ALL");

  const showStudentSection = isStudent || ((!isAuthenticated || isAdmin) && (visitorFilter === "ALL" || visitorFilter === "STUDENT"));
  const showPersonalSection = isPersonal || ((!isAuthenticated || isAdmin) && (visitorFilter === "ALL" || visitorFilter === "PERSONAL"));
  const showAcademiaSection = isAcademia || ((!isAuthenticated || isAdmin) && (visitorFilter === "ALL" || visitorFilter === "ACADEMIA"));

  return (
    <section id="planos" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header Personal */}
        {isPersonal && (
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Planos para Profissionais
            </div>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Escale sua carreira com o <span className="gradient-text">Conexão Fitness</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Prescreva treinos inteligentes, gerencie alunos, receba pagamentos diretos e aumente sua visibilidade no marketplace.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border/80 text-xs text-muted-foreground shadow-sm">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span>Conectado como <strong>{user?.name}</strong> • Planos exclusivos para Profissionais</span>
            </div>
          </div>
        )}

        {/* Header Academia */}
        {isAcademia && (
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Building2 className="w-3.5 h-3.5" /> Planos para Academias & Studios
            </div>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Modernize a gestão do seu <span className="gradient-text">espaço fitness</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Controle de catraca digital com QR Code, sistema completo de matrículas e exposição para milhares de alunos da sua cidade.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border/80 text-xs text-muted-foreground shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conectado como <strong>{user?.name}</strong> • Planos exclusivos para Academias</span>
            </div>
          </div>
        )}

        {/* Header Student */}
        {isStudent && (
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Dumbbell className="w-3.5 h-3.5" /> Planos para Alunos & Atletas
            </div>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Treine com mais <span className="gradient-text">economia e liberdade</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Acesso facilitado a treinos, agendamento de diárias, descontos exclusivos e acompanhamento com profissionais renomados.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border/80 text-xs text-muted-foreground shadow-sm">
              <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
              <span>Conectado como <strong>{user?.name}</strong> • Planos exclusivos para Alunos</span>
            </div>
          </div>
        )}

        {/* Header para Visitante ou Admin */}
        {(!isAuthenticated || isAdmin) && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <Lock className="w-3.5 h-3.5" /> Pagamento Seguro Stripe
            </div>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Escolha seu <span className="gradient-text">plano</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Assinaturas mensais com renovação automática, cancelamento a qualquer momento e ativação instantânea via Stripe.
            </p>

            {isAdmin && (
              <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Modo Administrador: Catálogo completo de planos
              </div>
            )}

            {/* Filtros em abas para visitante ou administrador */}
            <div className="mt-7 flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setVisitorFilter("ALL")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  visitorFilter === "ALL"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Todos os Planos
              </button>
              <button
                type="button"
                onClick={() => setVisitorFilter("STUDENT")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  visitorFilter === "STUDENT"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Para Alunos & Atletas
              </button>
              <button
                type="button"
                onClick={() => setVisitorFilter("PERSONAL")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  visitorFilter === "PERSONAL"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Para Profissionais
              </button>
              <button
                type="button"
                onClick={() => setVisitorFilter("ACADEMIA")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  visitorFilter === "ACADEMIA"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Para Academias & Studios
              </button>
            </div>
          </div>
        )}

        {/* User Plans */}
        {showStudentSection && (
          <div className="mb-20">
            {(!isAuthenticated || isAdmin) && (
              <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground flex items-center justify-center gap-2">
                <span>Para Usuários & Alunos</span>
              </h3>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {userPlans.map((plan) => {
                const active = isCurrentPlan(plan.name, "STUDENT");
                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                      plan.highlight
                        ? "bg-card border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105"
                        : "bg-card border border-border hover:border-purple-500/30"
                    }`}
                  >
                    <div className="absolute -top-3.5 inset-x-0 flex items-center justify-center gap-1.5 px-3 pointer-events-none z-10 flex-wrap">
                      {plan.highlight && (
                        <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-xs font-semibold text-white shadow">
                          Mais Popular
                        </span>
                      )}
                      {active && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Seu Plano Atual
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-center mb-6">
                        <h4 className="font-display font-bold text-lg text-foreground">{plan.name}</h4>
                        <p className="text-muted-foreground text-sm">{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                          <span className="text-muted-foreground block text-xs mt-1">{plan.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                            <Check className="w-4 h-4 text-purple-500 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant={active ? "outline" : plan.highlight ? "default" : "outline"}
                      onClick={() => handlePlanAction(plan, "STUDENT")}
                      className={`w-full ${
                        active
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : plan.highlight
                          ? "bg-purple-600 hover:bg-purple-700 text-white font-bold"
                          : "font-semibold"
                      }`}
                    >
                      {active ? "Plano Ativo" : plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Personal Plans */}
        {showPersonalSection && (
          <div className="mb-20">
            {(!isAuthenticated || isAdmin) && (
              <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground flex items-center justify-center gap-2">
                <span>Para Profissionais (Personal, Nutri, Fisio)</span>
              </h3>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {personalPlans.map((plan) => {
                const active = isCurrentPlan(plan.name, "PERSONAL");
                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                      plan.highlight
                        ? "bg-card border-2 border-primary shadow-glow-blue scale-105"
                        : "bg-card border border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="absolute -top-3.5 inset-x-0 flex items-center justify-center gap-1.5 px-3 pointer-events-none z-10 flex-wrap">
                      {plan.highlight && (
                        <span className="px-3 py-0.5 rounded-full gradient-primary text-xs font-semibold text-primary-foreground shadow">
                          Mais Popular
                        </span>
                      )}
                      {active && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Seu Plano Atual
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-center mb-6">
                        <h4 className="font-display font-bold text-lg text-foreground">{plan.name}</h4>
                        <p className="text-muted-foreground text-sm">{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                          <span className="text-muted-foreground block text-xs mt-1">{plan.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant={active ? "outline" : plan.highlight ? "hero" : "outline"}
                      onClick={() => handlePlanAction(plan, "PERSONAL")}
                      className={`w-full ${
                        active
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "font-bold"
                      }`}
                    >
                      {active ? "Plano Ativo" : plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gym Plans */}
        {showAcademiaSection && (
          <div className="mb-12">
            {(!isAuthenticated || isAdmin) && (
              <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground flex items-center justify-center gap-2">
                <span>Para Academias & Studios</span>
              </h3>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {gymPlans.map((plan) => {
                const active = isCurrentPlan(plan.name, "ACADEMIA");
                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                      plan.highlight
                        ? "bg-card border-2 border-secondary shadow-glow-green scale-105"
                        : "bg-card border border-border hover:border-secondary/30"
                    }`}
                  >
                    <div className="absolute -top-3.5 inset-x-0 flex items-center justify-center gap-1.5 px-3 pointer-events-none z-10 flex-wrap">
                      {plan.highlight && (
                        <span className="px-3 py-0.5 rounded-full gradient-secondary text-xs font-semibold text-secondary-foreground shadow">
                          Recomendado
                        </span>
                      )}
                      {active && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Seu Plano Atual
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-center mb-6">
                        <h4 className="font-display font-bold text-lg text-foreground">{plan.name}</h4>
                        <p className="text-muted-foreground text-sm">{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                          <span className="text-muted-foreground block text-xs mt-1">{plan.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                            <Check className="w-4 h-4 text-secondary shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant={active ? "outline" : plan.highlight ? "success" : "outline"}
                      onClick={() => handlePlanAction(plan, "ACADEMIA")}
                      className={`w-full ${
                        active
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "font-bold"
                      }`}
                    >
                      {active ? "Plano Ativo" : plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stripe Trust Footer */}
        <div className="p-6 rounded-3xl bg-card border border-border/70 max-w-3xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Processamento Seguro de Assinaturas com Stripe</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Todas as transações são criptografadas de ponta a ponta com padrão bancário PCI-DSS Nível 1. Cancele ou altere seu plano quando quiser sem taxas adicionais.
          </p>
        </div>
      </div>

      {/* Stripe Subscription Modal */}
      <StripeSubscriptionModal
        isOpen={!!selectedPlanForStripe}
        plan={selectedPlanForStripe}
        onClose={() => setSelectedPlanForStripe(null)}
      />
    </section>
  );
};

export default PlansSection;

