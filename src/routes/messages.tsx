import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { MessageSquare } from "lucide-react";

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
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh", paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "#FFFFFF",
        borderBottom: "0.5px solid #E8E4DC",
        padding: "14px 16px",
        paddingTop: "max(14px, env(safe-area-inset-top))",
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1A1A18" }}>Messages</h1>
      </div>

      {isLoading ? (
        <div style={{ padding: "32px 16px", textAlign: "center", color: "#6B6B68", fontSize: 14 }}>Loading...</div>
      ) : threads.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#EAF4EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={32} color="#B7D9C4" />
          </div>
          <p style={{ fontSize: 15, color: "#6B6B68", fontWeight: 500, margin: 0 }}>No messages yet.</p>
          <p style={{ fontSize: 13, color: "#A8A8A5", margin: 0 }}>Tap a listing to start a conversation.</p>
        </div>
      ) : (
        threads.map((thread: any) => {
          const isLandlord = thread.landlord_id === user?.id;
          const other = isLandlord ? thread.tenant : thread.landlord;
          const name = other?.full_name || "User";
          const initial = name.charAt(0).toUpperCase();
          const hasUnread = thread.unread_count > 0;

          return (
            <button
              key={thread.id}
              onClick={() => navigate({ to: `/messages/${thread.id}` })}
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
                padding: "14px 16px",
                backgroundColor: "#FFFFFF",
                border: "none",
                borderBottom: "0.5px solid #E8E4DC",
                cursor: "pointer", textAlign: "left",
              }}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  backgroundColor: "#1B4332", color: "#FFFFFF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700,
                }}>
                  {initial}
                </div>
                {hasUnread && (
                  <div style={{
                    position: "absolute", top: 0, right: -1,
                    width: 12, height: 12, borderRadius: "50%",
                    backgroundColor: "#D4A017",
                    border: "2px solid #FFFFFF",
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <p style={{
                    margin: 0, fontSize: 15,
                    fontWeight: hasUnread ? 700 : 500,
                    color: "#1A1A18",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%",
                  }}>
                    {name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: hasUnread ? "#1B4332" : "#A8A8A5", fontWeight: hasUnread ? 600 : 400, flexShrink: 0 }}>
                    {formatTime(thread.last_message_at)}
                  </p>
                </div>
                {thread.listing && (
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: "#6B6B68", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {thread.listing.title}
                  </p>
                )}
                <p style={{
                  margin: 0, fontSize: 13,
                  color: hasUnread ? "#1A1A18" : "#6B6B68",
                  fontWeight: hasUnread ? 500 : 400,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {thread.last_message_preview || "Started a conversation"}
                </p>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
