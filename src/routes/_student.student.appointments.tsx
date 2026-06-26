// Student Appointments — Supabase-backed
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar, AlertTriangle, MapPin, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_student/student/appointments")({
  head: () => ({ meta: [{ title: "My Appointments — NjangaRent" }] }),
  component: StudentAppointments,
});

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700",   icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700",       icon: XCircle },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-600",   icon: CheckCircle2 },
};

function StudentAppointments() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["student-appointments-full", user?.id, filter],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from("appointments")
        .select("*, listings(id, title, display_address, exterior_images)")
        .eq("student_id", user.id)
        .order("scheduled_date", { ascending: true });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-appointments-full"] }),
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
  ] as const;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Your scheduled property viewings.</p>
        </div>
        <Button asChild variant="default" size="sm" className="rounded-xl gap-2">
          <Link to="/explore">
            <Plus className="h-4 w-4" /> Find listings
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load appointments: {(error as Error).message}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No appointments</p>
          <p className="text-xs mt-1">Book a viewing from any listing page.</p>
          <Button asChild variant="default" size="sm" className="mt-4 rounded-xl">
            <Link to="/explore">Browse Listings</Link>
          </Button>
        </div>
      )}

      {/* Appointment cards */}
      <div className="space-y-4">
        {(data as any[]).map((a) => {
          const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          const listing = a.listings as any;
          const thumb = listing?.exterior_images?.[0];
          const dateStr = a.scheduled_date
            ? new Date(a.scheduled_date).toLocaleDateString("en-CM", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
            : "Date TBD";
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card overflow-hidden flex gap-0">
              {/* Thumbnail */}
              {thumb && (
                <div className="w-24 shrink-0 bg-muted">
                  <img src={thumb} alt="listing" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm text-foreground line-clamp-1">
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
                    {a.slot && (
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        Time slot: {a.slot}
                      </p>
                    )}
                  </div>
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1", cfg.color)}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                </div>

                {a.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-8 text-xs text-destructive border-destructive/30"
                      onClick={() => cancelMut.mutate(a.id)}
                      disabled={cancelMut.isPending}
                    >
                      {cancelMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel"}
                    </Button>
                    {listing?.id && (
                      <Button asChild variant="ghost" size="sm" className="rounded-xl h-8 text-xs">
                        <Link to="/listing/$id" params={{ id: listing.id }}>View Listing →</Link>
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
