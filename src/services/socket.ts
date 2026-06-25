// src/services/socket.ts — Singleton Socket.io client for NjangaRent
import { io, type Socket } from "socket.io-client";
import type { Message } from "@/api/messages.api";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (import.meta.env.VITE_SOCKET_URL ?? window.location.origin)
    : "";

let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      autoConnect: false,
      transports:  ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return _socket;
}

export const socketService = {
  /** Connect to Socket.io server with the user's JWT. */
  connect(token: string): void {
    const socket = getSocket();
    if (socket.connected) return;
    // Pass token as query param (Flask-SocketIO reads it on connect)
    socket.auth = { token };
    socket.io.opts.query = { token };
    socket.connect();
  },

  /** Disconnect and clean up the socket. */
  disconnect(): void {
    _socket?.disconnect();
  },

  /** Join a conversation room to receive real-time messages. */
  joinConversation(conversationId: string): void {
    getSocket().emit("join_conversation", { conversationId });
  },

  /** Send a text message. */
  sendTextMessage(conversationId: string, text: string): void {
    getSocket().emit("send_message", {
      conversationId,
      content: { type: "text", text },
    });
  },

  /** Send an image message (URL already uploaded via REST). */
  sendImageMessage(conversationId: string, imageUrl: string): void {
    getSocket().emit("send_message", {
      conversationId,
      content: { type: "image", imageUrl },
    });
  },

  /** Mark all messages in a conversation as read. */
  markRead(conversationId: string): void {
    getSocket().emit("read_messages", { conversationId });
  },

  /** Notify server that user started typing. */
  typingStart(conversationId: string): void {
    getSocket().emit("typing_start", { conversationId });
  },

  /** Notify server that user stopped typing. */
  typingStop(conversationId: string): void {
    getSocket().emit("typing_stop", { conversationId });
  },

  // ── Event listeners ────────────────────────────────────────────────────────

  onNewMessage(cb: (msg: Message) => void): () => void {
    const socket = getSocket();
    socket.on("new_message", cb);
    return () => socket.off("new_message", cb);
  },

  onConversationUpdated(cb: (data: {
    conversationId: string;
    lastMessage: string;
    lastActivity: string;
  }) => void): () => void {
    const socket = getSocket();
    socket.on("conversation_updated", cb);
    return () => socket.off("conversation_updated", cb);
  },

  onTyping(cb: (data: { userId: string; conversationId: string }) => void): () => void {
    const socket = getSocket();
    socket.on("typing", cb);
    return () => socket.off("typing", cb);
  },

  onStopTyping(cb: (data: { userId: string; conversationId: string }) => void): () => void {
    const socket = getSocket();
    socket.on("stop_typing", cb);
    return () => socket.off("stop_typing", cb);
  },

  onPaymentStatusUpdate(cb: (data: {
    paymentId: string;
    status: string;
    payment: Record<string, unknown>;
  }) => void): () => void {
    const socket = getSocket();
    socket.on("payment_status_update", cb);
    return () => socket.off("payment_status_update", cb);
  },

  onConnect(cb: () => void): () => void {
    const socket = getSocket();
    socket.on("connect", cb);
    return () => socket.off("connect", cb);
  },

  onDisconnect(cb: (reason: string) => void): () => void {
    const socket = getSocket();
    socket.on("disconnect", cb);
    return () => socket.off("disconnect", cb);
  },

  isConnected(): boolean {
    return _socket?.connected ?? false;
  },
};
