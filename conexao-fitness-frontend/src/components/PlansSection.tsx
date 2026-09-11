import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ShieldCheck, Zap, Lock, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { StripeSubscriptionModal } from "./StripeSubscriptionModal";

interface PlanItem {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  cta: string;
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
      "Comissão de 12%",
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
    features: [
      "Comissão de 10%",
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
    features: [
      "Comissão de 8%",
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
    features: [
      "✨ Prescritor Inteligente de Treinos & Dietas",
      "📲 Envio Direto para o App do Aluno",
      "Comissão reduzida de 6%",
      "Prioridade máxima nas buscas",
      "Página personalizada e suporte prioritário",
    ],
    highlight: true,
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
    features: [
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
    features: [
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
    features: [
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
    roleCategory?: "STUDENT" | "PERSONAL" | "ACADEMIA";
  } | null>(null);

  const handlePlanAction = (plan: PlanItem, roleCategory: "STUDENT" | "PERSONAL" | "ACADEMIA") => {
    if (!isAuthenticated) {
      toast.info("Faça login para assinar um plano", {
        description: "Redirecionando para a tela de login...",
      });
      navigate("/login");
      return;
    }

    if (plan.name === "Gratuito") {
      if (user) {
        setUser({ ...user, plan: "Gratuito" } as any);
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
      roleCategory,
    });
  };

  const isCurrentPlan = (planName: string, roleCategory: "STUDENT" | "PERSONAL" | "ACADEMIA") => {
    if (!isAuthenticated || !user) return false;
    const currentPlanName = (user as any).plan || localStorage.getItem("cf_user_plan") || "Gratuito";
    if (user.role === roleCategory && currentPlanName.toLowerCase() === planName.toLowerCase()) {
      return true;
    }
    return false;
  };

  return (
    <section id="planos" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" /> Pagamento Seguro Stripe
          </div>
          <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Escolha seu <span className="gradient-text">plano</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Assinaturas mensais com renovação automática, cancelamento a qualquer momento e ativação instantânea via Stripe.
          </p>
        </div>

        {/* User Plans */}
        <div className="mb-20">
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground flex items-center justify-center gap-2">
            <span>Para Usuários & Alunos</span>
          </h3>
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
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-xs font-semibold text-white">
                      Mais Popular
                    </div>
                  )}
                  {active && (
                    <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
                      Seu Plano Atual
                    </div>
                  )}
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

        {/* Personal Plans */}
        <div className="mb-20">
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground flex items-center justify-center gap-2">
            <span>Para Profissionais (Personal, Nutri, Fisio)</span>
          </h3>
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
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-xs font-semibold text-primary-foreground">
                      Mais Popular
                    </div>
                  )}
                  {active && (
                    <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
                      Seu Plano Atual
                    </div>
                  )}
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

        {/* Gym Plans */}
        <div className="mb-12">
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground flex items-center justify-center gap-2">
            <span>Para Academias & Studios</span>
          </h3>
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
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-secondary text-xs font-semibold text-secondary-foreground">
                      Recomendado
                    </div>
                  )}
                  {active && (
                    <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
                      Seu Plano Atual
                    </div>
                  )}
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

