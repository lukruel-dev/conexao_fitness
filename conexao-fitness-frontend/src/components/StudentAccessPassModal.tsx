import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSvg } from './QRCodeSvg';
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { formatBRL } from '@/lib/format';
import { toast } from 'sonner';

interface StudentAccessPassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: {
    id: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    qrAccessCode: string;
    daysRemaining?: number;
    isExpired?: boolean;
    student?: {
      name: string;
      email?: string;
      avatarUrl?: string;
      cpf?: string;
    };
    academia?: {
      name: string;
      avatarUrl?: string;
      cityBase?: string;
      academiaProfile?: {
        nomeFantasia?: string;
      };
    };
  } | null;
}

export const StudentAccessPassModal: React.FC<StudentAccessPassModalProps> = ({
  open,
  onOpenChange,
  enrollment,
}) => {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  if (!enrollment) return null;

  const isExpired =
    enrollment.isExpired ||
    enrollment.status === 'EXPIRED' ||
    new Date(enrollment.endDate).getTime() < Date.now();

  const isSuspended = enrollment.status === 'SUSPENDED';
  const isCancelled = enrollment.status === 'CANCELLED';

  const academiaTitle =
    enrollment.academia?.academiaProfile?.nomeFantasia ||
    enrollment.academia?.name ||
    'Academia Parceira';

  const formattedEnd = new Date(enrollment.endDate).toLocaleDateString('pt-BR');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(enrollment.qrAccessCode);
    setCopied(true);
    toast.success('Código copiado!', { description: enrollment.qrAccessCode });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gradient-to-b from-card to-background border-border/80 rounded-3xl shadow-2xl">
        {/* Header decorativo da carteirinha */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Conexão Fitness Pass
                </span>
                <DialogTitle className="font-display text-lg font-bold text-foreground line-clamp-1">
                  {academiaTitle}
                </DialogTitle>
              </div>
            </div>

            {/* Status Badge */}
            {!isExpired && !isSuspended && !isCancelled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ATIVO
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-destructive/15 text-destructive border border-destructive/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                VENCIDO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                BLOQUEADO
              </span>
            )}
          </div>
        </div>

        {/* Corpo do Passe */}
        <div className="p-6 space-y-6">
          {/* Card do Aluno & Plano */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-primary/40 bg-muted flex items-center justify-center shadow-inner">
              {enrollment.student?.avatarUrl ? (
                <img
                  src={enrollment.student.avatarUrl}
                  alt={enrollment.student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-lg text-foreground">
                  {enrollment.student?.name ? enrollment.student.name[0].toUpperCase() : 'A'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground text-base truncate">
                {enrollment.student?.name || 'Aluno Conexão Fitness'}
              </h4>
              <p className="text-xs text-primary font-semibold truncate">
                {enrollment.planName}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3 text-muted-foreground/80" />
                <span>Válido até {formattedEnd}</span>
                {enrollment.daysRemaining !== undefined && !isExpired && (
                  <span className="font-semibold text-emerald-500">
                    ({enrollment.daysRemaining} dias restantes)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Área do QR Code com Borda de Leitura */}
          <div className="flex flex-col items-center justify-center p-6 bg-card border-2 border-dashed border-primary/40 rounded-3xl relative overflow-hidden group">
            {/* Linha animada de scanner */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-pulse" />

            <div className="relative p-2 bg-white rounded-2xl shadow-xl">
              <QRCodeSvg
                value={`CONEXAO_FITNESS_ACCESS:${enrollment.qrAccessCode}`}
                size={180}
              />
            </div>

            {/* Código em texto para digitação manual se o leitor falhar */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono bg-muted/70 px-3 py-1.5 rounded-xl border border-border">
                {enrollment.qrAccessCode}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                onClick={handleCopyCode}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            {/* Relógio dinâmico para evitar print estático */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Validação em tempo real: <strong className="text-foreground">{currentTime}</strong></span>
            </div>
          </div>

          {/* Instruções de Acesso */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              Aponte este QR Code para a câmera da <strong>catraca ou leitor da recepção</strong> da academia para liberar a sua entrada instantaneamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/20 border-t border-border/50 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Fechar Passe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
