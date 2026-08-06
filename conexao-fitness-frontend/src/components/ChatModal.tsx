import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listChatMessages, sendChatMessage } from "@/services/chat";
import { useAuth } from "@/contexts/AuthContext";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  title?: string;
}

const ChatModal = ({ open, onOpenChange, bookingId, title }: ChatModalProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat-messages", bookingId],
    queryFn: () => listChatMessages(bookingId),
    enabled: open && !!bookingId,
    refetchInterval: open ? 4000 : false,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendChatMessage(bookingId, text),
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["chat-messages", bookingId] });
    },
    onError: (err: Error) => toast.error("Erro ao enviar", { description: err.message }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 flex flex-col h-[60dvh] sm:h-[600px] w-[95vw] sm:w-full mt-auto mb-4 sm:my-auto">
        <DialogHeader className="p-4 pr-12 border-b border-border">
          <DialogTitle className="leading-snug">Chat {title ? `· ${title}` : ""}</DialogTitle>
          <DialogDescription className="text-xs">
            Por segurança, mensagens com telefone, PIX ou referência a pagamentos externos serão bloqueadas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center">Carregando...</p>
          ) : !messages || messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">Nenhuma mensagem ainda. Diga olá!</p>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`text-[10px] mt-1 opacity-70`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite sua mensagem..."
            maxLength={1000}
            disabled={sendMutation.isPending}
          />
          <Button type="submit" variant="hero" size="icon" disabled={sendMutation.isPending || !content.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
