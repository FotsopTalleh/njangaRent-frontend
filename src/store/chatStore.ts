// src/store/chatStore.ts — Zustand store for real-time chat state
import { create } from "zustand";
import type { Conversation, Message } from "@/api/messages.api";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId → messages
  typing: Record<string, string[]>;    // conversationId → userId[]

  // ── Actions ─────────────────────────────────────────────────────────────────
  setConversations: (convs: Conversation[]) => void;
  upsertConversation: (conv: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  clearMessages: (conversationId: string) => void;
  setTyping: (conversationId: string, userIds: string[]) => void;
  addTyping: (conversationId: string, userId: string) => void;
  removeTyping: (conversationId: string, userId: string) => void;

  /** Total unread count across all conversations for the current user role. */
  unreadTotal: (myId: string, myRole: "student" | "landlord") => number;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations:         [],
  activeConversationId:  null,
  messages:              {},
  typing:                {},

  setConversations: (convs) => set({ conversations: convs }),

  upsertConversation: (conv) =>
    set((s) => {
      const exists = s.conversations.findIndex((c) => c.id === conv.id);
      if (exists === -1) return { conversations: [conv, ...s.conversations] };
      const updated = [...s.conversations];
      updated[exists] = conv;
      return { conversations: updated };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } })),

  addMessage: (msg) =>
    set((s) => {
      const existing = s.messages[msg.conversationId] ?? [];
      const isDuplicate = existing.some((m) => m.id === msg.id);
      if (isDuplicate) return s;
      return {
        messages: {
          ...s.messages,
          [msg.conversationId]: [...existing, msg],
        },
      };
    }),

  clearMessages: (conversationId) =>
    set((s) => {
      const { [conversationId]: _removed, ...rest } = s.messages;
      return { messages: rest };
    }),

  setTyping: (conversationId, userIds) =>
    set((s) => ({ typing: { ...s.typing, [conversationId]: userIds } })),

  addTyping: (conversationId, userId) =>
    set((s) => {
      const current = s.typing[conversationId] ?? [];
      if (current.includes(userId)) return s;
      return { typing: { ...s.typing, [conversationId]: [...current, userId] } };
    }),

  removeTyping: (conversationId, userId) =>
    set((s) => ({
      typing: {
        ...s.typing,
        [conversationId]: (s.typing[conversationId] ?? []).filter((u) => u !== userId),
      },
    })),

  unreadTotal: (myId, myRole) => {
    const convs = get().conversations;
    return convs.reduce((total, conv) => {
      const count =
        myRole === "student"
          ? conv.studentUnreadCount
          : conv.landlordUnreadCount;
      return total + (count ?? 0);
    }, 0);
  },
}));
