import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import { adminApi } from "@/api/admin.api";

export const Route = createFileRoute("/_admin/admin/messages")({
  head: () => ({ meta: [{ title: "Messages Audit — Admin" }] }),
  component: AdminMessages,
});

function AdminMessages() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn:  () => adminApi.getMessages({ limit: 50 }),
  });

  const convs = (data?.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Messages Audit</h1>
        <p className="text-sm text-muted-foreground">Overview of all platform conversations.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && convs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No conversations yet.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {convs.map((conv, i) => (
          <div
            key={conv.id as string}
            className={`px-5 py-4 ${i !== 0 ? "border-t border-border" : ""}`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium">Conversation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Listing: <span className="font-mono">{(conv.listingId as string)?.slice(0, 8)}...</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Student: <span className="font-mono">{(conv.studentId as string)?.slice(0, 8)}...</span>
                  {" "}&bull; Landlord: <span className="font-mono">{(conv.landlordId as string)?.slice(0, 8)}...</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] italic">
                  {(conv.lastMessage as string) || "No messages"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {conv.lastActivity ? new Date(conv.lastActivity as string).toLocaleString("en-CM") : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
