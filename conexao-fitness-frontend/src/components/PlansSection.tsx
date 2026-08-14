import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const userPlans = [
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
    cta: "Começar",
  },
  {
    name: "Start",
    price: "R$ 99,90",
    period: "/mês",
    description: "Ideal para começar sua rotina",
    features: [
      "~6 treinos (R$15)",
      "~3 treinos (R$30)",
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
    ],
    highlight: false,
    cta: "Assinar Premium",
  },
];

const personalPlans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para quem está começando",
    features: [
      "Comissão de 12%",
      "Perfil listado",
    ],
    highlight: false,
    cta: "Começar",
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
      "Destaque nas buscas",
    ],
    highlight: true,
    cta: "Assinar Pro",
  },
  {
    name: "Elite",
    price: "R$ 299,90",
    period: "/mês",
    description: "Experiência completa",
    features: [
      "Comissão de 6%",
      "Prioridade máxima",
      "Página personalizada",
    ],
    highlight: false,
    cta: "Assinar Elite",
  },
];

const gymPlans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para conhecer a plataforma",
    features: [
      "Acesso básico",
      "Perfil listado",
    ],
    highlight: false,
    cta: "Começar",
  },
  {
    name: "Essencial",
    price: "R$ 99,90",
    period: " / A partir de",
    description: "Para academias em crescimento",
    features: [
      "Perfil verificado",
      "Day pass digital",
    ],
    highlight: false,
    cta: "Assinar Essencial",
  },
  {
    name: "Destaque",
    price: "R$ 249,90",
    period: " / A partir de",
    description: "Para atrair mais alunos",
    features: [
      "Tudo do Essencial",
      "Reservas ilimitadas",
      "Destaque regional",
    ],
    highlight: true,
    cta: "Assinar Destaque",
  },
  {
    name: "Elite",
    price: "R$ 449,90",
    period: " / A partir de",
    description: "Para grandes redes",
    features: [
      "Tudo do Destaque",
      "Prioridade máxima",
      "API de integração",
    ],
    highlight: false,
    cta: "Assinar Elite",
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
            Planos flexíveis para usuários, profissionais e academias.
          </p>
        </div>

        {/* User Plans */}
        <div className="mb-20">
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground">
            Para Usuários
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {userPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${
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
                      <Check className="w-4 h-4 text-purple-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  className={`w-full ${plan.highlight ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Plans */}
        <div className="mb-20">
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-foreground">
            Para Profissionais
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
                    <span className="text-muted-foreground block text-xs mt-1">{plan.period}</span>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
                    <span className="text-muted-foreground block text-xs mt-1">{plan.period}</span>
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
