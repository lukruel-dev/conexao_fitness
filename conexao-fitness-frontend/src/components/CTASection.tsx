import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full gradient-primary opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full gradient-secondary opacity-10 blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Pronto para <span className="gradient-text">transformar</span> sua rotina de treinos?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já encontraram academias e os mais diversos profissionais do mundo fitness de forma rápida e prática com a Conexão Fitness.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl">
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Falar com Especialista
            </Button>
          </div>

          {/* Trust */}
          <p className="mt-8 text-sm text-muted-foreground">
            ✓ Cadastro gratuito &nbsp; ✓ Sem compromisso &nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
