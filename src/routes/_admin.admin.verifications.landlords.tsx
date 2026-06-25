// Shared verification queue page — used by both landlord and student admin queues
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ShieldCheck, XCircle, ExternalLink, Users } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Button } from "@/components/ui/button";

// ── Landlords ─────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/_admin/admin/verifications/landlords")({
  head: () => ({ meta: [{ title: "Landlord Verifications — Admin" }] }),
  component: () => <VerificationQueue role="landlord" />,
});

// ── Shared component ──────────────────────────────────────────────────────────
function VerificationQueue({ role }: { role: "landlord" | "student" }) {
  const qc = useQueryClient();
  const [rejectId,  setRejectId]  = useState<string | null>(null);
  const [reason,    setReason]    = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications", role],
    queryFn:  () =>
      role === "landlord"
        ? adminApi.getLandlordVerifications()
        : adminApi.getStudentVerifications(),
  });

  const approveMut = useMutation({
    mutationFn: (userId: string) => adminApi.approveUser(userId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-verifications", role] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminApi.rejectUser(userId, reason),
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
          {data?.pagination?.total ?? 0} pending {role}{(data?.pagination?.total ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No pending {role} verifications.</p>
        </div>
      )}

      <div className="space-y-4">
        {users.map((u) => {
          const userId = u.id as string;
          const verif  = (u.verification ?? {}) as Record<string, string>;
          return (
            <div key={userId} className="rounded-2xl border border-border bg-card p-5 space-y-4">
              {/* User info */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">{u.fullName as string}</p>
                  <p className="text-sm text-muted-foreground">{u.email as string}</p>
                  {u.phone != null && <p className="text-xs text-muted-foreground mt-0.5">{String(u.phone)}</p>}
                  {u.matricNumber != null && <p className="text-xs text-muted-foreground mt-0.5">Matric: {String(u.matricNumber)}</p>}
                  {u.program != null && <p className="text-xs text-muted-foreground">Program: {String(u.program)}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Joined: {u.createdAt ? new Date(u.createdAt as string).toLocaleDateString("en-CM") : "—"}
                  </p>
                </div>

                {/* Document links */}
                {Object.keys(verif).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Documents</p>
                    {Object.entries(verif).map(([key, url]) => (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                        aria-label={`View ${key}`}
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Reject form */}
              {rejectId === userId && (
                <div className="rounded-xl bg-muted p-4 space-y-3">
                  <label htmlFor={`reject-reason-${userId}`} className="text-sm font-medium">
                    Rejection reason (will be sent to user)
                  </label>
                  <input
                    id={`reject-reason-${userId}`}
                    type="text"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. Invalid student ID, blurry document..."
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
                      {rejectMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Confirm reject"}
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
                    aria-label={`Approve ${u.fullName}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRejectId(userId); setReason(""); }}
                    className="gap-1.5 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                    aria-label={`Reject ${u.fullName}`}
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
