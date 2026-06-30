import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Plus, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/visits")({
  head: () => ({ meta: [{ title: "My Visits — NjangaRent" }] }),
  component: VisitsPage,
});

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",    icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",            icon: XCircle },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground",                                            icon: CheckCircle },
  declined:  { label: "Declined",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",            icon: XCircle },
};

function VisitsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["visits-page", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, listings(id, title, display_address, listing_images(url, category))")
        .eq("student_id", user.id)
        .order("scheduled_date", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user?.id,
    refetchInterval: 10_000,
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visits-page"] }),
  });

  const visits = data as any[];

  return (
    <div className="min-h-screen bg-background text-foreground pb-[calc(56px+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3.5 pt-[max(14px,env(safe-area-inset-top))] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Visits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your scheduled property viewings</p>
        </div>
        <Button asChild size="sm" className="rounded-xl gap-1.5 text-xs h-8">
          <Link to="/explore"><Plus className="h-3.5 w-3.5" />Browse</Link>
        </Button>
      </div>

      {error && (
        <div className="mx-4 mt-4 flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load visits: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && visits.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar size={32} className="text-primary/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No scheduled visits yet.</p>
          <p className="text-xs text-muted-foreground">Book a viewing from any listing page.</p>
          <Button asChild size="sm" className="rounded-xl mt-1">
            <Link to="/explore">Explore Listings</Link>
          </Button>
        </div>
      )}

      <div className="px-4 pt-4 space-y-3">
        {visits.map((visit) => {
          const cfg = STATUS_CONFIG[visit.status] ?? STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          const listing = visit.listings as any;
          const extImgs = listing?.listing_images?.filter((img: any) => img.category === 'exterior') || [];
          const thumb = extImgs.length > 0 ? extImgs[0].url : null;
          const dateStr = visit.scheduled_date
            ? new Date(visit.scheduled_date).toLocaleDateString("en-CM", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
            : "Date TBD";

          return (
            <div key={visit.id} className="rounded-2xl border border-border bg-card overflow-hidden flex">
              {/* Thumbnail */}
              {thumb && (
                <div className="w-24 shrink-0 bg-muted">
                  <img src={thumb} alt="listing" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3.5 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {listing?.title ?? "Property Viewing"}
                    </p>
                    {listing?.display_address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {listing.display_address}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {dateStr}
                    </p>
                    {visit.slot && (
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">Slot: {visit.slot}</p>
                    )}
                  </div>
                  <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0", cfg.color)}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                </div>

                {visit.status === "pending" && (
                  <div className="mt-2.5 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-7 text-xs text-destructive border-destructive/30"
                      onClick={() => cancelMut.mutate(visit.id)}
                      disabled={cancelMut.isPending}
                    >
                      Cancel
                    </Button>
                    {listing?.id && (
                      <Button asChild variant="ghost" size="sm" className="rounded-xl h-7 text-xs">
                        <Link to="/listing/$id" params={{ id: listing.id }}>View →</Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
