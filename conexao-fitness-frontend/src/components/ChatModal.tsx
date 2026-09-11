import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  MessageCircle,
  CheckCheck,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listChatMessages, sendChatMessage, type ChatMessage } from "@/services/chat";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/soundEffects";
import { validateChatMessage } from "@/lib/bioValidator";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  title?: string;
  recipientName?: string;
  recipientAvatar?: string;
  initialMessage?: string;
}

const QUICK_EMOJIS = ["💪", "🔥", "🏋️‍♂️", "🥗", "👏", "⚡", "🎯"];

const ChatModal = ({
  open,
  onOpenChange,
  bookingId,
  title,
  recipientName,
  recipientAvatar,
  initialMessage,
}: ChatModalProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && initialMessage && !content) {
      setContent(initialMessage);
    }
  }, [open, initialMessage]);

  const { data: rawMessages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", bookingId],
    queryFn: () => listChatMessages(bookingId),
    enabled: open && !!bookingId,
    refetchInterval: open ? 2500 : false,
  });

  // Sanitiza mensagens antigas caso tenham números ou dados proibidos armazenados no cache local
  const messages = rawMessages.map((m: ChatMessage) => {
    const check = validateChatMessage(m.content);
    if (!check.isValid && m.senderId !== "coach-finex") {
      return {
        ...m,
        content: "🛡️ [Mensagem oculta: conteúdo com telefone ou contato externo não permitido pelas regras do App Finex]",
        isBlocked: true,
      };
    }
    return m;
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => import("@/services/notifications").then((m) => m.listNotifications()),
    enabled: open,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && notifications) {
      const unreadChatNotifs = notifications.filter(
        (n) => !n.isRead && n.type === "CHAT" && n.referenceId === bookingId
      );
      if (unreadChatNotifs.length > 0) {
        import("@/services/notifications").then((m) => {
          Promise.all(unreadChatNotifs.map((n) => m.markNotificationRead(n.id))).then(() => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
            qc.invalidateQueries({ queryKey: ["unread-notifications"] });
          });
        });
      }
    }
  }, [open, notifications, bookingId, qc]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendChatMessage(bookingId, text, user),
    onSuccess: () => {
      setContent("");
      setSecurityError(null);
      sounds.playMessageSent();
      qc.invalidateQueries({ queryKey: ["chat-messages", bookingId] });
    },
    onError: (err: Error) => {
      sounds.playWarning();
      toast.error("Não foi possível enviar", { description: err.message });
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    // Validação estrita de segurança antes do envio
    const validation = validateChatMessage(trimmed);
    if (!validation.isValid) {
      sounds.playWarning();
      setSecurityError(
        validation.errorMessage ||
          "Por motivos de segurança, não é permitido o envio de números de telefone, WhatsApp, redes sociais ou contatos externos."
      );
      toast.error("Mensagem Bloqueada", {
        description:
          validation.errorMessage ||
          "O envio de contatos externos é proibido pelas regras da plataforma.",
        duration: 6000,
      });
      return;
    }

    setSecurityError(null);
    sendMutation.mutate(trimmed);
  };

  const handleSendEmoji = (emoji: string) => {
    setSecurityError(null);
    sendMutation.mutate(emoji);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);
    if (securityError) {
      const validation = validateChatMessage(val);
      if (validation.isValid) {
        setSecurityError(null);
      }
    }
  };

  const displayName = recipientName || title || "Chat Conexão Fitness";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 flex flex-col h-[80dvh] sm:h-[640px] w-[95vw] sm:w-full bg-card border-border/80 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Header */}
        <DialogHeader className="p-4 pr-12 border-b border-border/70 bg-muted/30 flex flex-row items-center gap-3 space-y-0 shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shrink-0 bg-muted">
            <img
              src={
                recipientAvatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
              }
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <DialogTitle className="leading-snug text-base font-bold font-display text-foreground truncate">
              {displayName}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online agora no App Finex
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Security Trust Indicator */}
        <div className="px-3.5 py-1.5 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-[11px] text-primary shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold">Ambiente Seguro Finex</span>
            <span className="text-muted-foreground hidden xs:inline">• Contratações e conversas protegidas</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Anti-Fraude</span>
          </div>
        </div>

        {/* Área de Mensagens */}
        <ScrollArea className="flex-1 p-4 bg-background/50">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Carregando mensagens...
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <MessageCircle className="w-10 h-10 text-primary mx-auto opacity-60" />
              <p className="text-sm font-bold text-foreground">Nenhuma mensagem ainda</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Envie uma mensagem ou tire dúvidas sobre seus treinos e acompanhamento!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m: any) => {
                const mine = m.senderId === user?.id || m.senderId === "current-user";
                const isBlocked = m.isBlocked;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm transition-all ${
                        isBlocked
                          ? "bg-destructive/10 text-destructive border border-destructive/30 rounded-br-none italic"
                          : mine
                          ? "bg-primary text-primary-foreground rounded-br-none font-medium"
                          : "bg-muted/80 text-foreground border border-border/60 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-75 text-[10px]">
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {mine && !isBlocked && <CheckCheck className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Security Warning Alert Banner (se o usuário tentar digitar/mandar telefone/whats) */}
        {securityError && (
          <div className="mx-3 my-2 p-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-sm shrink-0">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-destructive animate-bounce" />
            <div className="flex-1 space-y-0.5">
              <p className="font-bold text-destructive flex items-center gap-1">
                Bloqueio de Segurança Finex
              </p>
              <p className="text-[11px] text-destructive/90 leading-tight">
                {securityError}
              </p>
              <p className="text-[10px] text-muted-foreground pt-0.5">
                Para sua proteção e garantia de serviço, contrate e converse exclusivamente pelo App.
              </p>
            </div>
            <button
              onClick={() => setSecurityError(null)}
              className="p-1 hover:bg-destructive/10 rounded-lg text-destructive transition-colors shrink-0"
              title="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Barra de Emojis Rápidos */}
        <div className="px-3 py-1.5 bg-muted/40 border-t border-border/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Rápido:</span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSendEmoji(emoji)}
              className="text-base px-2 py-0.5 rounded-lg hover:bg-card hover:scale-125 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input de Envio */}
        <form onSubmit={handleSend} className="p-3 border-t border-border/70 bg-card flex items-center gap-2 shrink-0">
          <Input
            value={content}
            onChange={handleInputChange}
            placeholder="Digite sua mensagem sobre o treino..."
            maxLength={1000}
            disabled={sendMutation.isPending}
            className={`rounded-2xl h-11 text-xs sm:text-sm bg-muted/40 transition-all ${
              securityError ? "border-destructive/60 focus-visible:ring-destructive" : ""
            }`}
          />
          <Button
            type="submit"
            variant="hero"
            size="icon"
            disabled={sendMutation.isPending || !content.trim()}
            className="h-11 w-11 rounded-2xl shrink-0 shadow-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
