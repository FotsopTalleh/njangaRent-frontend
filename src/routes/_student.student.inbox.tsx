import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send, Image as ImageIcon } from "lucide-react";
import { messagesApi } from "@/api/messages.api";
import { socketService } from "@/services/socket";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/api/messages.api";

export const Route = createFileRoute("/_student/student/inbox")({
  head: () => ({ meta: [{ title: "Inbox — NjangaRent" }] }),
  component: StudentInbox,
});

function StudentInbox() {
  return <InboxShared role="student" />;
}

// ── Shared inbox component (used by both student and landlord) ─────────────────
export function InboxShared({ role }: { role: "student" | "landlord" }) {
  const user        = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const {
    conversations, activeConversationId, messages, typing,
    setConversations, upsertConversation, setActiveConversation,
    setMessages, addMessage, addTyping, removeTyping,
  } = useChatStore();

  const [text,        setText]        = useState("");
  const [sending,     setSending]     = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations", role],
    queryFn:  async () => {
      const res = await messagesApi.listConversations();
      setConversations(res.data);
      return res.data;
    },
  });

  const activeConv  = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    const res = await messagesApi.getMessages(convId);
    setMessages(convId, res.data);
    socketService.markRead(convId);
  }, [setMessages]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  // Socket setup
  useEffect(() => {
    if (!accessToken) return;
    socketService.connect(accessToken);

    const unsubs = [
      socketService.onNewMessage((msg) => addMessage(msg)),
      socketService.onConversationUpdated(({ conversationId, lastMessage, lastActivity }) => {
        const conv = conversations.find((c) => c.id === conversationId);
        if (conv) upsertConversation({ ...conv, lastMessage, lastActivity });
      }),
      socketService.onTyping(({ conversationId, userId }) => {
        if (userId !== user?.id) addTyping(conversationId, userId);
      }),
      socketService.onStopTyping(({ conversationId, userId }) => {
        removeTyping(conversationId, userId);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [accessToken, conversations, user?.id]);

  // Join socket room when conversation selected
  useEffect(() => {
    if (activeConversationId) {
      socketService.joinConversation(activeConversationId);
    }
  }, [activeConversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const sendMessage = () => {
    if (!text.trim() || !activeConversationId) return;
    socketService.sendTextMessage(activeConversationId, text.trim());
    socketService.typingStop(activeConversationId);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (!activeConversationId) return;
    socketService.typingStart(activeConversationId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (activeConversationId) socketService.typingStop(activeConversationId);
    }, 2000);
  };

  const myId = user?.id ?? "";

  return (
    <div className="flex h-[calc(100vh-4rem)] rounded-2xl border border-border overflow-hidden bg-card">
      {/* Sidebar: conversation list */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="font-semibold text-sm">Inbox</h1>
        </div>

        {loadingConvs ? (
          <div className="flex-1 flex items-center justify-center" aria-busy="true">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground px-4 text-center">
            <MessageSquare className="h-8 w-8 opacity-40" aria-hidden="true" />
            <p className="text-sm">No conversations yet. Message a landlord from a listing page.</p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto" role="list" aria-label="Conversations">
            {conversations.map((conv) => {
              const unread = role === "student" ? conv.studentUnreadCount : conv.landlordUnreadCount;
              return (
                <li key={conv.id} role="listitem">
                  <button
                    onClick={() => setActiveConversation(conv.id)}
                    aria-current={conv.id === activeConversationId ? "true" : undefined}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
                      conv.id === activeConversationId && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">Listing chat</p>
                      {unread > 0 && (
                        <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || "No messages yet"}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Chat area */}
      {activeConversationId ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium">Listing conversation</p>
              <p className="text-xs text-muted-foreground truncate max-w-xs">ID: {activeConversationId}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3" role="log" aria-label="Chat messages" aria-live="polite">
            {activeMessages.map((msg) => {
              const isMe = msg.senderId === myId;
              return (
                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md",
                    )}
                  >
                    {msg.content.type === "text" ? (
                      <p className="whitespace-pre-wrap break-words">{msg.content.text}</p>
                    ) : (
                      <img
                        src={msg.content.imageUrl}
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto"
                        loading="lazy"
                      />
                    )}
                    <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-CM", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {(typing[activeConversationId] ?? []).length > 0 && (
              <div className="flex justify-start" aria-live="polite" aria-label="Other person is typing">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-end gap-2">
              <textarea
                id="chat-input"
                rows={1}
                placeholder="Type a message..."
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Type a message"
                className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring max-h-28 overflow-y-auto"
                style={{ minHeight: "44px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                aria-label="Send message"
                className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
