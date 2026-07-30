import { apiRequest } from "@/lib/apiClient";

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function listChatMessages(bookingId: string) {
  return apiRequest<ChatMessage[]>(`/chat/messages/${bookingId}`);
}

export function sendChatMessage(bookingId: string, content: string) {
  return apiRequest<ChatMessage>(`/chat/messages`, {
    method: "POST",
    body: { bookingId, content },
  });
}
