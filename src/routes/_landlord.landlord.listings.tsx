import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Eye, Loader2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Listing } from "@/api/listings.api";

export const Route = createFileRoute("/_landlord/landlord/listings")({
  head: () => ({ meta: [{ title: "My Listings — NjangaRent" }] }),
  component: LandlordListings,
});

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_admin_review: { label: "Under review", color: "text-warning bg-warning/10" },
  active:               { label: "Active",        color: "text-success bg-success/10" },
  draft:                { label: "Draft",          color: "text-muted-foreground bg-muted" },
  rejected:             { label: "Rejected",       color: "text-destructive bg-destructive/10" },
  deactivated:          { label: "Deactivated",    color: "text-muted-foreground bg-muted" },
  flagged:              { label: "Flagged",         color: "text-destructive bg-destructive/10" },
};

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

function LandlordListings() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").update({ status: "deactivated" }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-listings"] }),
  });

  const listings: any[] = (data as any[]) ?? [];
  const activeCount = listings.filter((l: Listing) => l.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Listings</h1>
          <p className="text-sm text-muted-foreground">{activeCount} active listing{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild className="gap-1.5 rounded-xl">
          <Link to="/landlord/listings/create" aria-label="Create a new listing">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New listing
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="text-center py-16 text-muted-foreground rounded-2xl border border-dashed border-border">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p className="font-medium">No listings yet</p>
          <p className="text-sm mt-1">Create your first listing to start receiving inquiries.</p>
          <Button asChild className="mt-4 rounded-xl gap-1.5">
            <Link to="/landlord/listings/create">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create listing
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <ListingManageCard
            key={listing.id}
            listing={listing}
            onDeactivate={() => deactivate.mutate(listing.id)}
            deactivating={deactivate.isPending && deactivate.variables === listing.id}
          />
        ))}
      </div>
    </div>
  );
}

function ListingManageCard({
  listing,
  onDeactivate,
  deactivating,
}: {
  listing: Listing;
  onDeactivate: () => void;
  deactivating: boolean;
}) {
  const cfg        = STATUS_CONFIG[listing.status] ?? { label: listing.status, color: "text-muted-foreground bg-muted" };
  const primaryImg = listing.exteriorImages?.[0] ?? listing.roomImages?.[0];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
      {/* Image */}
      <div className="aspect-[16/9] bg-muted relative">
        {primaryImg ? (
          <img src={primaryImg} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <span className={cn("absolute top-2 right-2 text-xs font-medium px-2.5 py-0.5 rounded-full", cfg.color)}>
          {cfg.label}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{listing.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatXAF(listing.rentAmount)}/{listing.rentPeriod} &bull; {listing.viewsCount} view{listing.viewsCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 h-8">
            <Link to="/listing/$id" params={{ id: listing.id }} aria-label={`View public page for ${listing.title}`}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 h-8">
            <Link to="/landlord/listings/$id/edit" params={{ id: listing.id }} aria-label={`Edit ${listing.title}`}>
              Edit
            </Link>
          </Button>
          {listing.status !== "deactivated" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 px-0 rounded-xl text-muted-foreground hover:text-destructive"
              onClick={onDeactivate}
              disabled={deactivating}
              aria-label={`Deactivate ${listing.title}`}
            >
              {deactivating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
