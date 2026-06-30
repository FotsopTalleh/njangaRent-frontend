// Saved Listings page — student/tenant saved listings from Supabase
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, BookmarkMinus, AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_student/student/listings/saved")({
  head: () => ({ meta: [{ title: "Saved Listings — NjangaRent" }] }),
  component: SavedListings,
});

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

function SavedListings() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["saved-listings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("saved_listings")
        .select("id, listing_id, created_at, listings(id, title, display_address, rent_amount, rent_period, property_type, status, listing_images(url, category))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const unsaveMut = useMutation({
    mutationFn: async (savedId: string) => {
      const { error } = await supabase.from("saved_listings").delete().eq("id", savedId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-listings"] }),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Saved Listings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {(data as any[]).length} saved propert{(data as any[]).length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load saved listings: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !error && (data as any[]).length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No saved listings yet</p>
          <p className="text-xs mt-1">Tap the bookmark icon on any listing to save it here.</p>
          <Button asChild variant="default" size="sm" className="mt-4 rounded-xl">
            <Link to="/explore">Browse Listings</Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {(data as any[]).map((item) => {
          const listing = item.listings as any;
          if (!listing) return null;
          const extImgs = listing?.listing_images?.filter((img: any) => img.category === 'exterior') || [];
          const thumb = extImgs.length > 0 ? extImgs[0].url : null;
          return (
            <div key={item.id} className="rounded-2xl border border-border bg-card overflow-hidden flex">
              {/* Thumbnail */}
              <div className="w-28 shrink-0 bg-muted">
                {thumb ? (
                  <img src={thumb} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground opacity-40" />
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground line-clamp-1">{listing.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {listing.display_address ?? "Buea"}
                    </p>
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatXAF(listing.rent_amount ?? 0)}
                      <span className="text-xs font-normal text-muted-foreground">/{listing.rent_period ?? "month"}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl h-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => unsaveMut.mutate(item.id)}
                    disabled={unsaveMut.isPending}
                    aria-label="Remove from saved"
                  >
                    <BookmarkMinus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <Link to="/listing/$id" params={{ id: listing.id }}>
                    <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs">
                      View listing →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
