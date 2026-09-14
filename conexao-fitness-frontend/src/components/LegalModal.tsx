import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, FileText, Lock, RefreshCw, CheckCircle2 } from "lucide-react";

export type LegalDocType = "terms" | "privacy" | "lgpd" | "cancellation";

interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDoc?: LegalDocType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  open,
  onOpenChange,
  defaultDoc = "terms",
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(defaultDoc);

  React.useEffect(() => {
    if (defaultDoc) {
      setActiveDoc(defaultDoc);
    }
  }, [defaultDoc]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-card border-border/80 rounded-3xl overflow-hidden shadow-2xl z-[80]">
        <DialogHeader className="p-5 sm:p-6 bg-muted/30 border-b border-border/60">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Informações Legais & Transparência
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold font-display text-foreground">
            Conexão Fitness — Diretrizes & Políticas
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Transparência total para alunos, profissionais credenciados e academias parceiras.
          </DialogDescription>

          {/* Abas de Navegação */}
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto scrollbar-none flex-wrap">
            <button
              type="button"
              onClick={() => setActiveDoc("terms")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDoc === "terms"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc("privacy")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDoc === "privacy"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Privacidade
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc("lgpd")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDoc === "lgpd"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> LGPD
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc("cancellation")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDoc === "cancellation"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Cancelamento
            </button>
          </div>
        </DialogHeader>

        {/* Conteúdo do Documento */}
        <ScrollArea className="h-[340px] sm:h-[380px] p-5 sm:p-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {activeDoc === "terms" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-base">Termos de Uso da Plataforma</h3>
              <p>
                Bem-vindo ao <strong>Conexão Fitness</strong>. Ao utilizar nossos aplicativos web e móveis, você concorda com os termos aqui dispostos.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">1. Objeto e Escopo</h4>
              <p>
                O Conexão Fitness atua como plataforma tecnológica intermediadora entre alunos/praticantes de atividades físicas, profissionais de saúde e educação física (Personal Trainers, Nutricionistas, Fisioterapeutas) e estabelecimentos (Academias e Estúdios).
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">2. Responsabilidades dos Usuários</h4>
              <p>
                O usuário declara que as informações prestadas durante o cadastro são verídicas e assume a responsabilidade pela guarda segura de suas credenciais de acesso e do seu QR Code de acesso à catraca.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">3. Regras de Conduta na Comunidade</h4>
              <p>
                É estritamente proibido publicar conteúdos ofensivos, promover medicamentos sem prescrição médica ou praticar desintermediação de contatos fora dos canais seguros da plataforma.
              </p>
            </div>
          )}

          {activeDoc === "privacy" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-base">Política de Privacidade</h3>
              <p>
                A sua privacidade é fundamental para nós. Esta política explica como coletamos, usamos e protegemos suas informações.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">1. Coleta de Dados</h4>
              <p>
                Coletamos dados necessários para a criação de conta, agendamento de sessões, prescrição de treinos e validação de acesso em catracas digitais (nome, e-mail, foto de perfil, geolocalização e histórico de treinos).
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">2. Pagamentos e Dados Financeiros</h4>
              <p>
                Todas as operações financeiras são processadas por instituições parceiras com certificação PCI-DSS (Stripe). O Conexão Fitness não armazena dados sensíveis de cartões de crédito em servidores próprios.
              </p>
            </div>
          )}

          {activeDoc === "lgpd" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-base">Conformidade com a LGPD (Lei nº 13.709/2018)</h3>
              <p>
                Garantimos o cumprimento rigoroso da Lei Geral de Proteção de Dados Pessoais do Brasil.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">1. Seus Direitos</h4>
              <p>
                Você tem o direito de solicitar a qualquer momento a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incompletos ou a eliminação de dados desnecessários.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">2. Encarregado de Proteção de Dados (DPO)</h4>
              <p>
                Para exercer seus direitos relativos à LGPD, entre em contato através do e-mail <strong>dpo@conexaofitness.com.br</strong> ou pelo nosso canal oficial no WhatsApp.
              </p>
            </div>
          )}

          {activeDoc === "cancellation" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-base">Política de Cancelamento e Reembolso</h3>
              <p>
                Nossa política foi desenhada para ser justa, transparente e sem pegadinhas para alunos e parceiros.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">1. Assinaturas Mensais de Planos</h4>
              <p>
                As assinaturas mensais podem ser canceladas a qualquer momento diretamente pelo seu perfil, sem aplicação de multas rescisórias ou fidelidade obrigatória. O plano permanece ativo até o fim do ciclo vigente pago.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">2. Sessões com Profissionais</h4>
              <p>
                Cancelamentos de sessões individuais realizados com até 2 horas de antecedência ao horário agendado garantem estorno integral ou reagendamento sem custo adicional.
              </p>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">3. Day Pass e Diárias</h4>
              <p>
                O Day Pass adquirido que não tiver sido ativado na catraca poderá ser reembolsado para a sua Carteira Finex em até 7 dias corridos após a compra.
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 sm:p-5 border-t border-border/70 bg-card flex items-center justify-end">
          <Button
            type="button"
            variant="hero"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 font-bold text-xs"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
