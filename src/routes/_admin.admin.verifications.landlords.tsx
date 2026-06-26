// Landlord verification queue — reads directly from Supabase
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ShieldCheck, XCircle, AlertTriangle, Users } from "lucide-react";
import { getAdminUsers, adminApproveUser, adminRejectUser } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/verifications/landlords")({
  head: () => ({ meta: [{ title: "Landlord Verifications — Admin" }] }),
  component: () => <VerificationQueue role="landlord" />,
});

function VerificationQueue({ role }: { role: "landlord" | "student" }) {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-verifications", role],
    queryFn: () =>
      getAdminUsers({
        role: role === "landlord" ? "landlord" : "student",
        status: "PENDING",
        limit: 50,
      }),
    refetchInterval: 30_000,
  });

  const approveMut = useMutation({
    mutationFn: (userId: string) => adminApproveUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-verifications", role] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ userId }: { userId: string; reason: string }) => adminRejectUser(userId),
    onSuccess: () => {
      setRejectId(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin-verifications", role] });
    },
  });

  const users = (data?.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight capitalize">
          {role} Verification Queue
        </h1>
        <p className="text-sm text-muted-foreground">
          {data?.pagination?.total ?? 0} pending {role}
          {(data?.pagination?.total ?? 0) !== 1 ? "s" : ""} · Live from Supabase
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load data: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && users.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p className="font-medium">No pending {role} verifications</p>
          <p className="text-xs mt-1">All applications have been reviewed.</p>
        </div>
      )}

      <div className="space-y-4">
        {users.map((u) => {
          const userId = u.id as string;
          const name = (u.full_name as string) || (u.email as string) || "Unknown";
          const email = u.email as string;
          const createdAt = u.created_at
            ? new Date(u.created_at as string).toLocaleDateString("en-CM", {
                day: "numeric", month: "short", year: "numeric",
              })
            : "—";

          return (
            <div key={userId} className="rounded-2xl border border-border bg-card p-5 space-y-4">
              {/* User info */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Applied: {createdAt}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  pending
                </span>
              </div>

              {/* Reject form */}
              {rejectId === userId && (
                <div className="rounded-xl bg-muted p-4 space-y-3">
                  <label htmlFor={`reject-${userId}`} className="text-sm font-medium">
                    Rejection reason
                  </label>
                  <input
                    id={`reject-${userId}`}
                    type="text"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. Invalid documents, missing ID..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setRejectId(null)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!reason.trim() || rejectMut.isPending}
                      onClick={() => rejectMut.mutate({ userId, reason })}
                      className="rounded-xl"
                    >
                      {rejectMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm reject"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {rejectId !== userId && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveMut.mutate(userId)}
                    disabled={approveMut.isPending && approveMut.variables === userId}
                    className="gap-1.5 rounded-xl"
                    aria-label={`Approve ${name}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRejectId(userId); setReason(""); }}
                    className="gap-1.5 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                    aria-label={`Reject ${name}`}
                  >
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { VerificationQueue };
