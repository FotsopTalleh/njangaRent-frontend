// Student Appointments — backend API (consistent with landlord dashboard)
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar, AlertTriangle, MapPin, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { appointmentsApi, type AppointmentStatus } from "@/api/appointments.api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_student/student/appointments")({
  head: () => ({ meta: [{ title: "My Appointments — NjangaRent" }] }),
  component: StudentAppointments,
});

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  pending:     { label: "Pending",     color: "bg-amber-100 text-amber-700",    icon: Clock },
  confirmed:   { label: "Confirmed",   color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rescheduled: { label: "Rescheduled", color: "bg-blue-100 text-blue-700",       icon: Calendar },
  cancelled:   { label: "Cancelled",   color: "bg-red-100 text-red-700",        icon: XCircle },
  declined:    { label: "Declined",    color: "bg-red-100 text-red-700",        icon: XCircle },
  completed:   { label: "Completed",   color: "bg-slate-100 text-slate-600",    icon: CheckCircle2 },
  expired:     { label: "Expired",     color: "bg-slate-100 text-slate-500",    icon: XCircle },
};

const SLOT_LABEL: Record<string, string> = {
  morning: "Morning (8am–12pm)",
  afternoon: "Afternoon (12pm–5pm)",
  evening: "Evening (5pm–8pm)",
};

function StudentAppointments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["student-appointments", filter],
    queryFn: async () => {
      const res = await appointmentsApi.list(
        filter !== "all" ? { status: filter as AppointmentStatus } : undefined
      );
      return res.data ?? [];
    },
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      await appointmentsApi.cancel(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-appointments"] }),
  });

  const filters = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
  ] as const;

  const appointments = (data ?? []) as any[];

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
            onClick={() => setFilter(f.key as any)}
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
          <span>Could not load appointments: {(error as any).message ?? "Unknown error"}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && appointments.length === 0 && !error && (
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
        {appointments.map((a) => {
          const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          const dateStr = a.proposedDate
            ? new Date(a.proposedDate).toLocaleDateString("en-CM", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })
            : "Date TBD";
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground line-clamp-1">
                    {a.listingTitle ?? "Property Viewing"}
                  </p>
                  {a.listingAddress && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" /> {a.listingAddress}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {dateStr}
                  </p>
                  {a.proposedSlot && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {SLOT_LABEL[a.proposedSlot] ?? a.proposedSlot}
                    </p>
                  )}
                  {a.landlordNote && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Landlord note: "{a.landlordNote}"
                    </p>
                  )}
                  {a.declineReason && (
                    <p className="text-xs text-destructive mt-1">
                      Declined: {a.declineReason}
                    </p>
                  )}
                </div>
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1", cfg.color)}>
                  <Icon className="h-3 w-3" /> {cfg.label}
                </span>
              </div>

              {a.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-8 text-xs text-destructive border-destructive/30"
                    onClick={() => cancelMut.mutate(a.id)}
                    disabled={cancelMut.isPending}
                  >
                    {cancelMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel"}
                  </Button>
                  {a.listingId && (
                    <Button asChild variant="ghost" size="sm" className="rounded-xl h-8 text-xs">
                      <Link to="/listing/$id" params={{ id: a.listingId }}>View Listing →</Link>
                    </Button>
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
