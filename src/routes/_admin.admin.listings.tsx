import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Building2, CheckCircle2, Flag, Trash2, AlertTriangle } from "lucide-react";
import { getAdminListings, adminApproveListing, adminFlagListing, adminRemoveListing } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/listings")({
  head: () => ({ meta: [{ title: "Listing Moderation — Admin" }] }),
  component: AdminListings,
});

const STATUS_COLORS: Record<string, string> = {
  pending_admin_review: "text-warning bg-warning/10",
  active:               "text-success bg-success/10",
  flagged:              "text-destructive bg-destructive/10",
  deactivated:          "text-muted-foreground bg-muted",
  rejected:             "text-destructive bg-destructive/10",
};

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

function AdminListings() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending_admin_review");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState<"flag" | "remove" | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-listings", statusFilter],
    queryFn: () => getAdminListings({ status: statusFilter, limit: 50 }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => adminApproveListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-listings"] }),
  });

  const actionMut = useMutation({
    mutationFn: ({ id, type, reason }: { id: string; type: "flag" | "remove"; reason: string }) =>
      type === "flag" ? adminFlagListing(id, reason) : adminRemoveListing(id, reason),
    onSuccess: () => {
      setActionId(null); setActionReason(""); setActionType(null);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    },
  });

  const listings = (data?.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Listing Moderation</h1>
        <p className="text-sm text-muted-foreground">Review and approve or moderate listings.</p>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger id="admin-listing-filter" className="w-56 rounded-xl" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending_admin_review">Under review</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="flagged">Flagged</SelectItem>
          <SelectItem value="deactivated">Deactivated</SelectItem>
        </SelectContent>
      </Select>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load listings: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No listings with this status.</p>
        </div>
      )}

      <div className="space-y-4">
        {listings.map((listing) => {
          const id = listing.id as string;
          const imgs = [...((listing.exteriorImages as string[]) ?? []), ...((listing.roomImages as string[]) ?? [])];

          return (
            <div key={id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="h-24 w-32 rounded-xl overflow-hidden bg-muted shrink-0">
                  {imgs[0] ? (
                    <img src={imgs[0]} alt={listing.title as string} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{listing.title as string}</p>
                      <p className="text-xs text-muted-foreground">{String(listing.property_type ?? "")} &bull; {formatXAF((listing.rent_amount as number) ?? 0)}/{String(listing.rent_period ?? "")}</p>
                      {listing.display_address != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {String(listing.display_address ?? "No address")}
                        </p>
                      )}
                    </div>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_COLORS[listing.status as string] ?? "bg-muted text-muted-foreground")}>
                      {listing.status as string}
                    </span>
                  </div>

                  {/* Actions */}
                  {actionId === id ? (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder={actionType === "flag" ? "Flag reason..." : "Removal reason..."}
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={actionType === "flag" ? "Flag reason" : "Removal reason"}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setActionId(null)} className="rounded-xl">Cancel</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!actionReason.trim() || actionMut.isPending}
                          onClick={() => actionMut.mutate({ id, type: actionType!, reason: actionReason })}
                          className="rounded-xl"
                        >
                          {actionMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Confirm"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {listing.status !== "active" && (
                        <Button
                          size="sm"
                          onClick={() => approveMut.mutate(id)}
                          disabled={approveMut.isPending}
                          className="rounded-xl h-8 gap-1.5 text-xs"
                          aria-label={`Approve ${listing.title}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 gap-1.5 text-xs text-warning border-warning/30"
                        onClick={() => { setActionId(id); setActionType("flag"); setActionReason(""); }}
                        aria-label={`Flag ${listing.title}`}
                      >
                        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                        Flag
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 gap-1.5 text-xs text-destructive border-destructive/30"
                        onClick={() => { setActionId(id); setActionType("remove"); setActionReason(""); }}
                        aria-label={`Remove ${listing.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
