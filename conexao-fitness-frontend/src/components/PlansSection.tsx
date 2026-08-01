import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const personalPlans = [
  {
    name: "Basic",
    price: "Grátis",
    period: "",
    description: "Para começar",
    features: [
      "Perfil verificado",
      "Até 10 leads/mês",
      "Chat com alunos",
      "Avaliações públicas",
    ],
    highlight: false,
    cta: "Começar Grátis",
  },
  {
    name: "Pro",
    price: "R$ 79",
    period: "/mês",
    description: "Mais visibilidade",
    features: [
      "Tudo do Basic",
      "Leads ilimitados",
      "Destaque nas buscas",
      "Analytics avançado",
      "Cupons promocionais",
    ],
    highlight: true,
    cta: "Assinar Pro",
  },
  {
    name: "Elite",
    price: "R$ 149",
    period: "/mês",
    description: "Máxima performance",
    features: [
      "Tudo do Pro",
      "Prioridade no ranking",
      "Comissão reduzida",
      "Página personalizada",
      "Suporte prioritário",
    ],
    highlight: false,
    cta: "Assinar Elite",
  },
];

const gymPlans = [
  {
    name: "Bronze",
    price: "R$ 149",
    period: "/mês",
    description: "1 unidade",
    features: [
      "Perfil verificado",
      "Day pass digital",
      "Até 50 reservas/mês",
      "Dashboard básico",
    ],
    highlight: false,
    cta: "Começar Bronze",
  },
  {
    name: "Prata",
    price: "R$ 299",
    period: "/mês",
    description: "Até 3 unidades",
    features: [
      "Tudo do Bronze",
      "Reservas ilimitadas",
      "Destaque regional",
      "Analytics completo",
      "Equipe de profissionais",
    ],
    highlight: true,
    cta: "Assinar Prata",
  },
  {
    name: "Ouro",
    price: "R$ 499",
    period: "/mês",
    description: "Unidades ilimitadas",
    features: [
      "Tudo do Prata",
      "Prioridade máxima",
      "Campanhas segmentadas",
      "API de integração",
      "Gerente de conta",
    ],
    highlight: false,
    cta: "Assinar Ouro",
  },
];

const PlansSection = () => {
  return (
    <section id="planos" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Planos e Preços</span>
          <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Escolha seu <span className="gradient-text">plano</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Planos flexíveis para profissionais e academias de todos os tamanhos.
          </p>
        </div>

        {/* Personal Plans */}
        <div className="mb-20">
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground">
            Para Profissionais
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {personalPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${
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
                <div className="text-center mb-6">
                  <h4 className="font-display font-bold text-lg text-foreground">{plan.name}</h4>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "hero" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Gym Plans */}
        <div>
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground">
            Para Academias
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {gymPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${
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
                <div className="text-center mb-6">
                  <h4 className="font-display font-bold text-lg text-foreground">{plan.name}</h4>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-secondary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "success" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
