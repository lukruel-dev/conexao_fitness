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
    <section id="para-alunos" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div>
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Para Alunos</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-6">
              Seu treino, <span className="text-secondary">sua escolha</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg">
              Viajando a trabalho ou lazer? Quer experimentar uma nova academia? 
              Encontre as melhores opções perto de você com poucos cliques.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                    <p className="text-muted-foreground text-xs">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center sm:justify-start">
              <Button variant="success" size="lg">
                Buscar Academias e Profissionais
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-card rounded-3xl p-6 border border-border shadow-card">
              {/* Mock Search Results */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">Uruguaiana, RS</span>
                </div>

                {/* Mock Cards */}
                {[
                  { name: "Academia Power Fit", type: "Academia", rating: 4.9, price: "Day Pass R$ 25" },
                  { name: "Personal João Silva", type: "Personal Trainer", rating: 5.0, price: "R$ 80/hora" },
                  { name: "CrossFit Uruguaiana", type: "Box de CrossFit", rating: 4.8, price: "Mensal R$ 150" },
                ].map((item, i) => (
                  <div
                    key={item.name}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      i === 0 ? "bg-primary/5 border-primary/30" : "bg-background border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.type}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-foreground font-medium">{item.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary font-semibold">{item.price}</span>
                      <span className="text-xs text-muted-foreground">0.5km</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full gradient-secondary opacity-20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full gradient-primary opacity-20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForStudentsSection;
