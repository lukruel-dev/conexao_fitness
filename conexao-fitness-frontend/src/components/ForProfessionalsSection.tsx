import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Calendar, DollarSign, BadgeCheck, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const personalFeatures = [
  { icon: BadgeCheck, text: "Perfil verificado com CREF" },
  { icon: Calendar, text: "Agenda integrada" },
  { icon: DollarSign, text: "Receba direto na conta" },
  { icon: BarChart3, text: "Métricas e insights" },
];

const gymFeatures = [
  { icon: Users, text: "Atraia novos alunos" },
  { icon: TrendingUp, text: "Aumente seu faturamento" },
  { icon: Calendar, text: "Day pass e planos flexíveis" },
  { icon: BarChart3, text: "Dashboard completo" },
];

const ForProfessionalsSection = () => {
  return (
    <section id="para-profissionais" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Para Profissionais</span>
          <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Cresça com a <span className="gradient-text">Conexão Fitness</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Seja você um profissional do universo fitness ou dono de academia, conecte-se com novos alunos e expanda seus negócios.
          </p>
        </div>

        {/* Two Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Personal Card */}
          <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold mb-3 text-foreground">
              Profissionais
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base mb-6">
              Crie seu perfil verificado, defina seus serviços e preços, e seja encontrado por alunos na sua região.
            </p>

            <ul className="space-y-3 mb-8">
              {personalFeatures.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-sm">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="hero" className="w-full h-auto py-3.5 whitespace-normal leading-normal text-sm sm:text-base">
              <Link to="/cadastro?type=profissional">
                Cadastrar como Profissional
              </Link>
            </Button>
          </div>

          {/* Academy Card */}
          <div className="bg-card rounded-3xl p-8 border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-card group">
            <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-3 text-foreground">
              Academias
            </h3>
            <p className="text-muted-foreground mb-6">
              Cadastre sua academia, ofereça day passes e planos flexíveis, e alcance novos públicos na sua região.
            </p>

            <ul className="space-y-3 mb-8">
              {gymFeatures.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-foreground text-sm">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="success" className="w-full h-auto py-3.5 whitespace-normal leading-normal text-sm sm:text-base">
              <Link to="/cadastro?type=academia">
                Cadastrar Academia
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForProfessionalsSection;
