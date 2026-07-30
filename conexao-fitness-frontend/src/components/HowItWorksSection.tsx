import { MapPin, Calendar, CreditCard, Star } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Busque por localização",
    description: "Use seu GPS ou digite o CEP para encontrar academias e personal trainers próximos.",
    color: "primary" as const,
  },
  {
    icon: Calendar,
    title: "Escolha e agende",
    description: "Compare preços, avaliações e disponibilidade. Reserve o horário que melhor funciona.",
    color: "secondary" as const,
  },
  {
    icon: CreditCard,
    title: "Pague com segurança",
    description: "Pix ou cartão de crédito. Transação segura com recibo automático.",
    color: "primary" as const,
  },
  {
    icon: Star,
    title: "Treine e avalie",
    description: "Após o treino, deixe sua avaliação e ajude outros a encontrar os melhores profissionais.",
    color: "secondary" as const,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Como funciona</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Simples e <span className="gradient-text">rápido</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Em poucos passos, você encontra o treino perfeito para suas necessidades.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group"
            >
              {/* Connection Line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card hover:-translate-y-1 h-full">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground border border-border">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  step.color === "primary" ? "gradient-primary" : "gradient-secondary"
                }`}>
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
