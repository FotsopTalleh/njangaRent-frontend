import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare, Search, Users, Clock, AlertCircle } from "lucide-react";
import { adminApi } from "@/api/admin.api";

export const Route = createFileRoute("/_admin/admin/messages")({
  head: () => ({ meta: [{ title: "Messages Audit — Admin" }] }),
  component: AdminMessages,
});

function AdminMessages() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const LIMIT = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-messages", page],
    queryFn: () => adminApi.getMessages({ page, limit: LIMIT }),
    placeholderData: (prev: any) => prev,
  });

  const convs = (data?.data ?? []) as Record<string, unknown>[];
  const total = (data as any)?.pagination?.total ?? convs.length;
  const hasNext = (data as any)?.pagination?.hasNext ?? false;

  const filtered = search.trim()
    ? convs.filter((c) => {
        const q = search.toLowerCase();
        return (
          (c.listingId as string)?.toLowerCase().includes(q) ||
          (c.studentId as string)?.toLowerCase().includes(q) ||
          (c.landlordId as string)?.toLowerCase().includes(q) ||
          (c.lastMessage as string)?.toLowerCase().includes(q)
        );
      })
    : convs;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Messages Audit</h1>
          <p className="text-sm text-muted-foreground">
            Platform conversations between tenants and landlords.
            {total > 0 && <span className="ml-1 font-medium text-foreground">{total} total</span>}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          id="admin-messages-search"
          type="search"
          placeholder="Search by ID or message content..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search conversations"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-center gap-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load conversations. Check your connection or backend status.</span>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>{search ? "No conversations matched your search." : "No conversations yet."}</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          {filtered.map((conv, i) => {
            const listingId = (conv.listingId as string) ?? "";
            const studentId = (conv.studentId as string) ?? "";
            const landlordId = (conv.landlordId as string) ?? "";
            const lastMessage = (conv.lastMessage as string) ?? "";
            const lastActivity = conv.lastActivity as string | undefined;
            const msgCount = (conv.messageCount as number) ?? 0;

            return (
              <div
                key={(conv.id as string) ?? i}
                className={`px-5 py-4 hover:bg-muted/40 transition-colors ${i !== 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <p className="text-sm font-medium truncate">
                        <span className="text-muted-foreground text-xs mr-1">Tenant:</span>
                        <span className="font-mono text-xs">{studentId ? studentId.slice(0, 12) + "..." : "-"}</span>
                        <span className="text-muted-foreground mx-2">to</span>
                        <span className="text-muted-foreground text-xs mr-1">Landlord:</span>
                        <span className="font-mono text-xs">{landlordId ? landlordId.slice(0, 12) + "..." : "-"}</span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Listing: <span className="font-mono">{listingId ? listingId.slice(0, 12) + "..." : "-"}</span>
                    </p>
                    {lastMessage && (
                      <p className="text-xs text-muted-foreground italic truncate max-w-sm">
                        "{lastMessage}"
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {msgCount > 0 && (
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {msgCount} msg{msgCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {lastActivity && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-end">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {new Date(lastActivity).toLocaleString("en-CM", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !search && convs.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {Math.ceil(total / LIMIT) || 1} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
