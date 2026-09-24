import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Star,
  ExternalLink,
  MessageCircle,
  Share2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExternalGym, indicateGymToFinex } from '@/services/externalGyms';

interface InviteGymModalProps {
  gym: ExternalGym | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndicated?: (gymId: string) => void;
}

export const InviteGymModal: React.FC<InviteGymModalProps> = ({
  gym,
  open,
  onOpenChange,
  onIndicated,
}) => {
  const [hasIndicated, setHasIndicated] = useState(false);
  const [indicatedCount, setIndicatedCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (gym) {
      setHasIndicated(Boolean(gym.userAlreadyIndicated));
      setIndicatedCount(gym.indicationCount || 0);
    }
  }, [gym]);

  if (!gym) return null;

  const inviteMessage = encodeURIComponent(
    `Olá! Sou aluno(a) e frequento a ${gym.name} em ${gym.city}. Gostaria muito que vocês fizessem parte do ecossistema Finex (https://finex.net.br) para liberar Day Pass digital por QR Code e matrículas no aplicativo!`
  );

  const handleIndicate = async () => {
    if (!gym || submitting) return;
    setSubmitting(true);
    try {
      const res = await indicateGymToFinex(gym);
      setHasIndicated(true);
      setIndicatedCount(res.totalIndications);
      toast.success('Indicação registrada com sucesso!', {
        description: `Nossa equipe de parcerias já recebeu seu interesse para credenciamento da ${gym.name}.`,
      });
      if (onIndicated) onIndicated(gym.placeId || gym.id);
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('já indicou')) {
        setHasIndicated(true);
        toast.info('Você já indicou esta academia anteriormente.');
      } else {
        toast.error('Não foi possível registrar a indicação no momento.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWhatsapp = () => {
    window.open(`https://api.whatsapp.com/send?text=${inviteMessage}`, '_blank');
    handleIndicate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card rounded-3xl border-border shadow-2xl">
        {/* Banner Superior com Imagem do Google */}
        <div className="relative h-44 w-full overflow-hidden bg-muted">
          <img
            src={gym.photoUrl}
            alt={gym.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Badge Informativo de Não Credenciada */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-black text-[11px] font-extrabold shadow-md backdrop-blur-md">
              <AlertCircle className="w-3.5 h-3.5" />
              Ainda não faz parte do ecossistema Finex
            </span>
          </div>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="text-lg font-black leading-tight drop-shadow-sm">
              {gym.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-white/90 mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{gym.address}</span>
            </div>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-2xl bg-muted/50 border border-border/60">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">{gym.googleRating}</span>
              <span className="text-muted-foreground">({gym.googleReviewsCount} avaliações no Google)</span>
            </div>
            <a
              href={gym.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              Ver no Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Ajude a trazer esta academia para a Finex
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quanto mais alunos indicarem a <strong>{gym.name}</strong>, mais rápido nosso time de expansão entrará em contato com a gerência para liberar o <strong>Day Pass com QR Code</strong> e <strong>Matrículas Online</strong> pelo app.
            </p>
          </div>

          {/* Contador de Indicações */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Alunos interessados nesta academia:
              </span>
            </div>
            <span className="text-xs font-black text-primary px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30">
              {indicatedCount} indicações
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleOpenWhatsapp}
              className="w-full h-11 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Convidar Academia pelo WhatsApp
            </Button>

            <Button
              variant={hasIndicated ? 'secondary' : 'outline'}
              onClick={handleIndicate}
              disabled={hasIndicated}
              className="w-full h-10 rounded-2xl font-semibold text-xs gap-1.5"
            >
              {hasIndicated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Você já indicou esta academia
                </>
              ) : (
                <>
                  <ThumbsUp className="w-3.5 h-3.5 text-primary" />
                  Registrar meu interesse (+1 Indicação)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
