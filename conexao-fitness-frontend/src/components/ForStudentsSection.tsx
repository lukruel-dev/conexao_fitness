import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Star, MessageCircle, Shield } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Busca Inteligente",
    description: "Filtros por modalidade, preço, avaliação, distância e disponibilidade.",
  },
  {
    icon: MapPin,
    title: "Geolocalização",
    description: "Encontre opções próximas onde você estiver, ideal para viagens.",
  },
  {
    icon: Calendar,
    title: "Agendamento Fácil",
    description: "Veja horários disponíveis e reserve em segundos.",
  },
  {
    icon: Star,
    title: "Avaliações Reais",
    description: "Leia opiniões de outros alunos antes de escolher.",
  },
  {
    icon: MessageCircle,
    title: "Chat Direto",
    description: "Converse com academias e personals antes de reservar.",
  },
  {
    icon: Shield,
    title: "Pagamento Seguro",
    description: "Pix e cartão com proteção total dos seus dados.",
  },
];

const ForStudentsSection = () => {
  return (
    <section id="para-alunos" className="py-16 md:py-32 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="min-w-0 w-full">
            <span className="text-secondary font-semibold text-xs sm:text-sm uppercase tracking-wider">Para Alunos</span>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mt-2 sm:mt-3 mb-4 sm:mb-6">
              Seu treino, <span className="text-secondary">sua escolha</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg mb-6 sm:mb-8 max-w-lg leading-relaxed">
              Viajando a trabalho ou lazer? Quer experimentar uma nova academia? 
              Encontre as melhores opções perto de você com poucos cliques.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">{feature.title}</h4>
                    <p className="text-muted-foreground text-xs leading-normal">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center sm:justify-start">
              <Link to="/buscar" className="w-full sm:w-auto">
                <Button variant="success" size="lg" className="w-full h-auto py-3.5 px-5 whitespace-normal leading-snug text-center text-sm sm:text-base">
                  Buscar Academias e Profissionais
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className="relative min-w-0 w-full">
            <div className="bg-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-border shadow-card overflow-hidden">
              {/* Mock Search Results */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-muted rounded-xl text-sm">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate">Uruguaiana, RS</span>
                </div>

                {/* Mock Cards */}
                {[
                  { name: "Academia Power Fit", type: "Academia", rating: 4.9, price: "Day Pass R$ 25" },
                  { name: "Personal João Silva", type: "Personal Trainer", rating: 5.0, price: "R$ 80/hora" },
                  { name: "CrossFit Uruguaiana", type: "Box de CrossFit", rating: 4.8, price: "Mensal R$ 150" },
                ].map((item, i) => (
                  <div
                    key={item.name}
                    className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
                      i === 0 ? "bg-primary/5 border-primary/30" : "bg-background border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{item.type}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm shrink-0 pt-0.5">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        <span className="text-foreground font-medium">{item.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-secondary font-semibold truncate">{item.price}</span>
                      <span className="text-xs text-muted-foreground shrink-0">0.5km</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full gradient-secondary opacity-20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full gradient-primary opacity-20 blur-2xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForStudentsSection;
