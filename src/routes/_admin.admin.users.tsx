import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, Ban, ShieldCheck, Search } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Admin" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const qc    = useQueryClient();
  const [q,   setQ]   = useState("");
  const [banId,      setBanId]      = useState<string | null>(null);
  const [banReason,  setBanReason]  = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", q],
    queryFn:  () => adminApi.getUsers({ q: q || undefined, limit: 50 }),
    enabled:  true,
  });

  const banMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.banUser(id, reason),
    onSuccess:  () => { setBanId(null); setBanReason(""); refetch(); },
  });

  const unbanMut = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess:  () => refetch(),
  });

  const users = (data?.data ?? []) as Record<string, unknown>[];

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE:   "text-success bg-success/10",
    PENDING:  "text-warning bg-warning/10",
    BANNED:   "text-destructive bg-destructive/10",
    REJECTED: "text-destructive bg-destructive/10",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">Search, ban, or unban platform users.</p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          id="admin-user-search"
          type="search"
          placeholder="Search by name or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search users"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No users found.</p>
        </div>
      )}

      <div className="space-y-3">
        {users.map((u) => {
          const userId = u.id as string;
          const status = (u.status as string) ?? "ACTIVE";
          return (
            <div key={userId} className="rounded-xl border border-border bg-card px-4 py-3.5 space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-sm">{u.fullName as string}</p>
                  <p className="text-xs text-muted-foreground">{u.email as string} &bull; <span className="capitalize">{u.role as string}</span></p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}>
                  {status}
                </span>
              </div>

              {/* Ban form */}
              {banId === userId && (
                <div className="rounded-xl bg-muted p-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Reason for ban..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Ban reason"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setBanId(null)} className="rounded-xl">Cancel</Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!banReason.trim() || banMut.isPending}
                      onClick={() => banMut.mutate({ id: userId, reason: banReason })}
                      className="rounded-xl"
                    >
                      {banMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Confirm ban"}
                    </Button>
                  </div>
                </div>
              )}

              {banId !== userId && (
                <div className="flex gap-2">
                  {status === "BANNED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl h-8 gap-1.5 text-xs text-success border-success/30"
                      onClick={() => unbanMut.mutate(userId)}
                      disabled={unbanMut.isPending}
                      aria-label={`Unban ${u.fullName}`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Unban
                    </Button>
                  ) : (
                    status !== "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 gap-1.5 text-xs text-destructive border-destructive/30"
                        onClick={() => { setBanId(userId); setBanReason(""); }}
                        aria-label={`Ban ${u.fullName}`}
                      >
                        <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                        Ban
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
