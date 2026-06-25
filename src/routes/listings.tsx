import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Home } from "lucide-react";
import { motion } from "framer-motion";
import { ListingCard } from "@/components/ListingCard";
import { listingsApi } from "@/api/listings.api";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/authStore";
import { paginateDummyListings } from "@/data/dummyListings";

// ── Import ListingFilters inline (avoid circular for this public route)
import { ListingFilters } from "@/components/ListingFilters";
import type { BrowseListingsParams } from "@/api/listings.api";

export const Route = createFileRoute("/listings")({
  head: () => ({
    meta: [
      { title: "Browse Listings — NjangaRent Buea" },
      { name: "description", content: "Find verified rooms, studios, and apartments across Molyko, Bonduma, Great Soppo, and all neighbourhoods in Buea, Cameroon." },
    ],
  }),
  component: ListingsBrowse,
});

function ListingsBrowse() {
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useState<BrowseListingsParams>({
    sort: "newest",
    page: 1,
    limit: 20,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", params],
    queryFn:  () => listingsApi.browse(params),
    staleTime: 30_000,
    retry: 1,
  });

  // Fallback to dummy data when backend is unavailable
  const useDummy = isError || (!isLoading && !data);
  const dummyResult = useDummy ? paginateDummyListings(params) : null;

  const listings   = useDummy ? (dummyResult?.data ?? []) : (data?.data ?? []);
  const pagination = useDummy ? dummyResult?.pagination : data?.pagination;

  return (
    <div className="min-h-screen bg-background">
      {/* Public nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <BrandMark />
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" className="rounded-xl">
                <Link to={
                  user.role === "landlord" ? "/landlord/dashboard" :
                  user.role === "admin"    ? "/admin/dashboard"    :
                  "/tenant/dashboard"
                }>
                  My dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Button asChild size="sm" className="rounded-xl">
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            Find your home in Buea
          </h1>
          <p className="text-muted-foreground text-sm">
            {pagination?.total != null
              ? `${pagination.total} verified properties across Buea`
              : "Browse verified housing across Buea"
            }
            {useDummy && (
              <span className="ml-2 text-xs text-muted-foreground/60">(demo listings)</span>
            )}
          </p>
        </div>

        <ListingFilters params={params} onChange={(p) => setParams({ ...p, page: 1 })} className="mb-6" />

        {isLoading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            aria-busy="true"
            aria-label="Loading listings"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card animate-pulse">
                <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="font-medium">No listings match your filters</p>
            <p className="text-sm mt-1">Try adjusting or clearing your filters.</p>
          </div>
        )}

        {!isLoading && listings.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </motion.div>

            {/* Pagination */}
            {pagination && (pagination.page > 1 || pagination.hasNext) && (
              <div className="flex items-center justify-center gap-3 mt-10" role="navigation" aria-label="Listings pagination">
                <Button
                  variant="outline"
                  disabled={params.page === 1}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page}
                </span>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
