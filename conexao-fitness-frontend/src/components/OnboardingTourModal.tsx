import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { sounds } from '@/lib/soundEffects';
import {
  Sparkles,
  Dumbbell,
  ShieldCheck,
  Award,
  QrCode,
  Zap,
  Gift,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
} from 'lucide-react';

interface OnboardingTourModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const ONBOARDING_KEY = 'cf_onboarding_completed_v1';

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setCurrentStep(0);
      return;
    }
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        setOpen(true);
        sounds.playNotification();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    sounds.playAchievement();
    setOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep((prev) => prev + 1);
      sounds.playNotification();
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const slides = [
    {
      badge: 'Bem-vindo ao Finex',
      title: 'A Plataforma Definitiva para sua Evolução Fitness',
      description: 'Conecte-se às melhores academias parceiras, encontre personais trainers de elite e gerencie toda sua rotina de treinos e pagamentos em um único aplicativo.',
      icon: <Dumbbell className="w-10 h-10 text-primary" />,
      color: 'from-primary/20 via-primary/5 to-transparent',
      borderColor: 'border-primary/40',
      highlights: [
        'Geolocalização para encontrar academias e personais próximos',
        'Avaliações reais de alunos e profissionais verificados',
        'Contratação 100% segura e digital',
      ],
    },
    {
      badge: 'Catraca Inteligente & Day Pass',
      title: 'Acesso Liberado por QR Code na Catraca',
      description: 'Treine quando e onde quiser sem contratos abusivos. Adquira Day Pass avulso ou faça matrícula online e apresente seu passe digital direto na catraca.',
      icon: <QrCode className="w-10 h-10 text-emerald-400" />,
      color: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/40',
      highlights: [
        'Liberação instantânea com QR Code na câmera da catraca',
        'Matrícula com validação presencial por foto e CPF',
        'Sem taxas de cancelamento ou fidelidade surpresa',
      ],
    },
    {
      badge: 'Personais & Fichas no App',
      title: 'Consultorias Mensais com Ficha Personalizada',
      description: 'Tenha acompanhamento próximo de personais trainers e nutricionistas com fichas de treino periodizadas, controle de cargas e suporte contínuo no WhatsApp.',
      icon: <Zap className="w-10 h-10 text-secondary" />,
      color: 'from-secondary/20 via-secondary/5 to-transparent',
      borderColor: 'border-secondary/40',
      highlights: [
        'Planos Mensais, Trimestrais e Semestrais customizados',
        'Ficha no App Finex com cronômetro de descanso e séries',
        'Orientações e ajustes de cargas semanais pelo seu personal',
      ],
    },
    {
      badge: 'Gamificação & Recompensas',
      title: 'Pins de Conquista & Caixa Misteriosa Finex',
      description: 'Acumule pontos treinando com frequência. Equipe Pins Oficiais ao lado do seu nome, garanta Day Pass de amigo 1x por mês e resgate brindes oficiais com 1.000 pts!',
      icon: <Gift className="w-10 h-10 text-amber-400" />,
      color: 'from-amber-500/20 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-500/40',
      highlights: [
        'Pins de Conquista para exibir no seu perfil e comunidade',
        'Day Pass Amigo grátis 1x/mês em academias parceiras',
        'Caixa Misteriosa com Camisetas Dry-Fit, Canecas Inox e Squeezes',
      ],
    },
  ];

  const currentSlide = slides[currentStep];

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleFinish()}>
      <DialogContent className="max-w-lg p-0 bg-card border-border/80 rounded-3xl overflow-hidden shadow-2xl">
        <div className={`p-6 sm:p-8 bg-gradient-to-b ${currentSlide.color} border-b ${currentSlide.borderColor} space-y-6 relative`}>
          {/* Botão Fechar / Pular */}
          <button
            onClick={handleFinish}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Pular Tour"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge & Ícone */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/15 border border-primary/20">
              {currentSlide.badge}
            </span>
            <div className="w-14 h-14 rounded-2xl bg-card border border-border/70 flex items-center justify-center shadow-lg">
              {currentSlide.icon}
            </div>
          </div>

          {/* Título & Descrição */}
          <div className="space-y-2">
            <h2 className="font-display font-black text-xl sm:text-2xl text-foreground leading-tight">
              {currentSlide.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {currentSlide.description}
            </p>
          </div>

          {/* Destaques com Check */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            {currentSlide.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé com Navegação */}
        <div className="p-4 sm:p-6 bg-card flex items-center justify-between gap-4">
          {/* Indicador de passos */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-10 px-3 rounded-xl text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}

            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={handleNext}
              className="h-10 px-5 rounded-xl font-extrabold text-xs shadow-glow gap-1.5 text-black"
            >
              {currentStep === slides.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4" /> Começar Agora
                </>
              ) : (
                <>
                  Próximo <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
