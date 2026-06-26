import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — NjangaRent" }] }),
  component: MessagesPage,
});

function formatTime(dateString: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (diff < 24) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diff < 48) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function MessagesPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["messages", "threads"],
    queryFn: async () => {
      const res = await fetch("/api/messages/threads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 10000,
  });

  const threads = data?.data || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-[calc(56px+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3.5 pt-[max(14px,env(safe-area-inset-top))]">
        <h1 className="text-xl font-bold text-foreground">Messages</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare size={32} className="text-primary/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No messages yet.</p>
          <p className="text-xs text-muted-foreground">Start a conversation from any listing page.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {threads.map((thread: any) => {
            const other = thread.landlord?.id === user?.id ? thread.student : thread.landlord;
            const name = other?.full_name || other?.name || "Unknown";
            const initial = name.charAt(0).toUpperCase();
            const unread = thread.unreadCount > 0;
            return (
              <li key={thread.id}>
                <button
                  onClick={() => navigate({ to: "/messages/$threadId", params: { threadId: thread.id } })}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center text-base font-bold shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={cn("text-sm truncate", unread ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                        {name}
                      </p>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        {formatTime(thread.lastMessage?.createdAt ?? thread.updatedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className={cn("text-xs truncate", unread ? "text-foreground/70" : "text-muted-foreground")}>
                        {thread.lastMessage?.body || thread.listing?.title || "New conversation"}
                      </p>
                      {unread && (
                        <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
