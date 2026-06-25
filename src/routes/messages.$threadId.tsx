import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages/$threadId")({
  head: () => ({ meta: [{ title: "Chat — NjangaRent" }] }),
  component: ThreadViewPage,
});

function formatDateSeparator(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function ThreadViewPage() {
  const { threadId } = Route.useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Thread Context (we need landlord name, avatar, etc.)
  // We can get this by finding the thread from the list query, or we can fetch a specific endpoint.
  // We'll rely on the threads list query for the header context to save an API call if it exists.
  const { data: threadsData } = useQuery({
    queryKey: ["messages", "threads"],
    queryFn: async () => {
      const res = await fetch(`/api/messages/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!token,
  });
  
  const threadContext = threadsData?.data?.find((t: any) => t.id === threadId);

  // Fetch Messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!token,
  });

  const messages = messagesData?.data || [];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Visual Viewport Listener for Soft Keyboard
  useEffect(() => {
    if (!window.visualViewport) return;
    const viewport = window.visualViewport;
    const onResize = () => {
      // Calculate how much the keyboard has pushed up the viewport
      const offset = window.innerHeight - viewport.height;
      // Depending on OS/browser, we might need to adjust. 
      // For PWA on iOS/Android, updating bottom padding is usually safe.
      setKeyboardOffset(offset > 0 ? offset : 0);
      scrollToBottom();
    };
    viewport.addEventListener("resize", onResize);
    viewport.addEventListener("scroll", onResize);
    return () => {
      viewport.removeEventListener("resize", onResize);
      viewport.removeEventListener("scroll", onResize);
    };
  }, []);

  // SSE Subscription
  useEffect(() => {
    if (!token) return;
    const source = new EventSource(`/api/messages/stream?token=${token}`);
    
    source.onmessage = (e) => {
      const newMsg = JSON.parse(e.data);
      if (newMsg.thread_id === threadId) {
        queryClient.setQueryData(["messages", threadId], (old: any) => {
          if (!old) return old;
          // Avoid duplicates
          if (old.data.some((m: any) => m.id === newMsg.id)) return old;
          return { ...old, data: [...old.data, newMsg] };
        });
        
        // Mark read
        fetch(`/api/messages/threads/${threadId}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    };

    return () => source.close();
  }, [threadId, token, queryClient]);

  // Send Message Mutation
  const sendMessage = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/messages/threads/${threadId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ body })
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["messages", threadId] });
      const previousMessages = queryClient.getQueryData(["messages", threadId]);
      
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        thread_id: threadId,
        sender_id: user?.id,
        body,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(["messages", threadId], (old: any) => {
        if (!old) return { data: [optimisticMsg] };
        return { ...old, data: [...old.data, optimisticMsg] };
      });
      
      setInputText("");
      setTimeout(scrollToBottom, 50); // Give DOM time to update

      return { previousMessages };
    },
    onError: (err, newTodo, context: any) => {
      queryClient.setQueryData(["messages", threadId], context.previousMessages);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", threadId] });
      queryClient.invalidateQueries({ queryKey: ["messages", "threads"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage.mutate(inputText);
  };

  const otherUser = threadContext?.landlord_id === user?.id ? threadContext?.tenant : threadContext?.landlord;
  const name = otherUser?.full_name || "User";
  const initials = name.charAt(0).toUpperCase();

  return (
    <div 
      className="flex flex-col bg-surface-base h-[100dvh]" 
      style={{ paddingBottom: `${keyboardOffset}px` }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-surface-base px-4 py-3 border-b border-border-default pt-[calc(12px+env(safe-area-inset-top))] flex items-center gap-3">
        <button 
          onClick={() => router.history.back()} 
          className="p-1 -ml-1 rounded-full hover:bg-black/5"
        >
          <ArrowLeft className="h-6 w-6 text-text-primary" />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-[16px] shrink-0">
          {initials}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-semibold text-text-primary truncate leading-tight">{name}</h2>
          {threadContext?.listing && (
            <p className="text-[12px] text-text-secondary truncate mt-0.5">{threadContext.listing.title}</p>
          )}
        </div>
      </div>

      {/* Message List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {isLoading ? (
          <div className="text-center text-text-secondary text-[14px]">Loading chat...</div>
        ) : (
          messages.map((msg: any, index: number) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            
            // Date separator logic
            const showDate = !prevMsg || 
              new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

            return (
              <div key={msg.id} className="flex flex-col">
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-[11px] font-medium text-text-muted">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                
                <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                  <div 
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                      isMe 
                        ? "bg-brand-primary text-white rounded-[16px_16px_4px_16px]" 
                        : "bg-[#F1EFE8] text-text-primary rounded-[16px_16px_16px_4px]"
                    )}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {msg.body}
                  </div>
                </div>
                
                <div className={cn("text-[10px] text-text-muted mt-1", isMe ? "text-right" : "text-left")}>
                  {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 z-20 bg-surface-base border-t border-border-default p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface-card border-[0.5px] border-border-strong rounded-[20px] px-4 py-3 text-[15px] text-text-primary resize-none focus:outline-none focus:border-brand-primary min-h-[48px] max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || sendMessage.isPending}
            className="w-[48px] h-[48px] shrink-0 rounded-full bg-brand-primary flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send className="h-5 w-5 text-white ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
