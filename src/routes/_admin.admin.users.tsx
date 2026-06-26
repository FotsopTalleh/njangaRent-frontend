// Admin User Management — reads/writes directly from Supabase
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, Ban, ShieldCheck, Search, AlertTriangle } from "lucide-react";
import { getAdminUsers, adminBanUser, adminApproveUser } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Admin" }] }),
  component: AdminUsers,
});

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "text-emerald-700 bg-emerald-100",
  PENDING:  "text-amber-700 bg-amber-100",
  BANNED:   "text-red-700 bg-red-100",
  REJECTED: "text-red-700 bg-red-100",
};

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [banId, setBanId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce the search
  const handleSearch = (val: string) => {
    setQ(val);
    clearTimeout((window as any).__userSearchTimer);
    (window as any).__userSearchTimer = setTimeout(() => setDebouncedQ(val), 400);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", debouncedQ],
    queryFn: () => getAdminUsers({ q: debouncedQ || undefined, limit: 100 }),
    staleTime: 30_000,
  });

  const banMut = useMutation({
    mutationFn: (id: string) => adminBanUser(id),
    onSuccess: () => { setBanId(null); setBanReason(""); refetch(); },
  });

  const unbanMut = useMutation({
    mutationFn: (id: string) => adminApproveUser(id), // sets status back to ACTIVE
    onSuccess: () => refetch(),
  });

  const users = (data?.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">
          {data?.pagination?.total ?? 0} total users · Search, ban, or unban platform accounts.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          id="admin-user-search"
          type="search"
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search users"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load users: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && users.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p className="font-medium">No users found</p>
          {debouncedQ && <p className="text-xs mt-1">Try a different search term</p>}
        </div>
      )}

      <div className="space-y-3">
        {users.map((u) => {
          const userId = u.id as string;
          const status = (u.status as string) ?? "ACTIVE";
          const name = (u.full_name as string) || "—";
          const email = u.email as string;
          const role = u.role as string;
          const joined = u.created_at
            ? new Date(u.created_at as string).toLocaleDateString("en-CM", { day: "numeric", month: "short", year: "numeric" })
            : "—";

          return (
            <div key={userId} className="rounded-xl border border-border bg-card px-4 py-3.5 space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-sm text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {email} &bull; <span className="capitalize">{role}</span> &bull; Joined {joined}
                  </p>
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
                    placeholder="Reason for ban…"
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
                      onClick={() => banMut.mutate(userId)}
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
                      className="rounded-xl h-8 gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => unbanMut.mutate(userId)}
                      disabled={unbanMut.isPending}
                      aria-label={`Unban ${name}`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Unban
                    </Button>
                  ) : (
                    status !== "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => { setBanId(userId); setBanReason(""); }}
                        aria-label={`Ban ${name}`}
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
