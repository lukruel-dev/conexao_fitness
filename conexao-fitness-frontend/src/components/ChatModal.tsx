import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, MessageCircle, Mic, Smile, CheckCheck } from "lucide-react";
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

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  title?: string;
  recipientName?: string;
  recipientAvatar?: string;
}

const QUICK_EMOJIS = ["💪", "🔥", "🏋️‍♂️", "🥗", "👏", "⚡", "🎯"];

const ChatModal = ({
  open,
  onOpenChange,
  bookingId,
  title,
  recipientName,
  recipientAvatar,
}: ChatModalProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", bookingId],
    queryFn: () => listChatMessages(bookingId),
    enabled: open && !!bookingId,
    refetchInterval: open ? 2500 : false,
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
      sounds.playMessageSent();
      qc.invalidateQueries({ queryKey: ["chat-messages", bookingId] });
    },
    onError: (err: Error) => toast.error("Erro ao enviar", { description: err.message }),
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleSendEmoji = (emoji: string) => {
    sendMutation.mutate(emoji);
  };

  const displayName = recipientName || title || "Chat Conexão Fitness";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 flex flex-col h-[75dvh] sm:h-[620px] w-[95vw] sm:w-full bg-card border-border/80 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Header */}
        <DialogHeader className="p-4 pr-12 border-b border-border/70 bg-muted/30 flex flex-row items-center gap-3 space-y-0">
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
              {messages.map((m: ChatMessage) => {
                const mine = m.senderId === user?.id || m.senderId === "current-user";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm transition-all ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-none"
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
                        {mine && <CheckCheck className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Barra de Emojis Rápidos */}
        <div className="px-3 py-1.5 bg-muted/40 border-t border-border/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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
        <form onSubmit={handleSend} className="p-3 border-t border-border/70 bg-card flex items-center gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite sua mensagem sobre o treino..."
            maxLength={1000}
            disabled={sendMutation.isPending}
            className="rounded-2xl h-11 text-xs sm:text-sm bg-muted/40"
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
