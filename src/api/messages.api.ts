// src/api/messages.api.ts — NjangaRent conversation REST endpoints
import { axiosClient } from "./axiosClient";

export interface Conversation {
  id: string;
  listingId: string;
  studentId: string;
  landlordId: string;
  lastMessage: string;
  lastActivity: string;
  studentUnreadCount: number;
  landlordUnreadCount: number;
  createdAt: string;
}

export type MessageContentType = "text" | "image";

export interface MessageContent {
  type: MessageContentType;
  text?: string;
  imageUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "student" | "landlord";
  content: MessageContent;
  createdAt: string;
}

export interface PaginatedMessages {
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export const messagesApi = {
  /** List own conversations. */
  listConversations: async (): Promise<{ data: Conversation[] }> => {
    const res = await axiosClient.get("/messages/conversations");
    return res.data;
  },

  /** Student: initiate a conversation on a listing. Returns existing if already exists. */
  initiate: async (listingId: string): Promise<{ data: Conversation }> => {
    const res = await axiosClient.post("/messages/conversations", { listingId });
    return res.data;
  },

  /** Get paginated message history for a conversation. */
  getMessages: async (
    conversationId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedMessages> => {
    const res = await axiosClient.get(`/messages/conversations/${conversationId}`, {
      params: { page, limit },
    });
    return res.data;
  },
};
