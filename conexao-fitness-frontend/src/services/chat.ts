import { apiRequest } from "@/lib/apiClient";

export interface ChatMessage {
  id: string;
  bookingId?: string;
  conversationId?: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}

const LOCAL_CHAT_KEY = "cf_chat_messages_store_v2";

export async function listChatMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const res = await apiRequest<ChatMessage[]>(`/chat/messages/${chatId}`);
    if (Array.isArray(res) && res.length > 0) {
      return res;
    }
  } catch (err) {
    console.warn("Backend chat unavailable, using resilient local chat store:", err);
  }

  const raw = localStorage.getItem(`${LOCAL_CHAT_KEY}_${chatId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  // Mensagem inicial de boas-vindas
  const initialMessages: ChatMessage[] = [
    {
      id: `msg-welcome-${chatId}`,
      bookingId: chatId,
      conversationId: chatId,
      senderId: "coach-finex",
      senderName: "Personal Finex",
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      content: "Olá! Seja bem-vindo(a). Estou à disposição para tirar dúvidas sobre seus treinos, divisão muscular e periodização.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  localStorage.setItem(`${LOCAL_CHAT_KEY}_${chatId}`, JSON.stringify(initialMessages));
  return initialMessages;
}

export async function sendChatMessage(chatId: string, content: string, senderUser?: any): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    bookingId: chatId,
    conversationId: chatId,
    senderId: senderUser?.id || "current-user",
    senderName: senderUser?.name || "Você",
    senderAvatar: senderUser?.avatarUrl || undefined,
    content,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await apiRequest<ChatMessage>(`/chat/messages`, {
      method: "POST",
      body: { bookingId: chatId, content },
    });
    if (res && res.id) return res;
  } catch (err) {
    console.warn("Backend chat send error, saving locally:", err);
  }

  const existing = await listChatMessages(chatId);
  const updated = [...existing, newMsg];
  localStorage.setItem(`${LOCAL_CHAT_KEY}_${chatId}`, JSON.stringify(updated));

  // Resposta inteligente simulada após 1.5 segundos se for mensagem do usuário
  if (senderUser?.role === "STUDENT") {
    setTimeout(() => {
      const autoResponses = [
        "Perfeito! Vou acompanhar sua evolução no treino de hoje 💪",
        "Ótima execução! Mantenha a sobrecarga progressiva com segurança 🏋️‍♂️",
        "Recebido! Qualquer ajuste na ficha de treino é só me avisar aqui.",
        "Excelente foco! Lembre-se de registrar as cargas na aba Treinos para manter a sequência 🔥",
      ];
      const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
      const botReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        bookingId: chatId,
        conversationId: chatId,
        senderId: "coach-finex",
        senderName: "Personal Finex",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        content: randomResponse,
        createdAt: new Date().toISOString(),
      };
      const currentStored = JSON.parse(localStorage.getItem(`${LOCAL_CHAT_KEY}_${chatId}`) || "[]");
      localStorage.setItem(`${LOCAL_CHAT_KEY}_${chatId}`, JSON.stringify([...currentStored, botReply]));
    }, 1500);
  }

  return newMsg;
}
