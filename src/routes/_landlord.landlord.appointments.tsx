// Landlord Appointments — backend API (no direct Supabase calls)
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar, CheckCircle2, XCircle, MapPin, User, AlertTriangle } from "lucide-react";
import { appointmentsApi } from "@/api/appointments.api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_landlord/landlord/appointments")({
  head: () => ({ meta: [{ title: "Viewing Requests — NjangaRent" }] }),
  component: LandlordAppointments,
});

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-600" },
  declined:  { label: "Declined",  color: "bg-red-100 text-red-700" },
};

function LandlordAppointments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch via backend (raw SQL, bypasses RLS)
  const { data, isLoading, error } = useQuery({
    queryKey: ["landlord-appointments", statusFilter],
    queryFn: async () => {
      const res = await appointmentsApi.list(
        statusFilter !== "all" ? { status: statusFilter as any } : undefined
      );
      return res.data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (status === "confirmed") await appointmentsApi.respond(id, { action: "confirm" });
      else if (status === "declined") await appointmentsApi.respond(id, { action: "decline" });
      else if (status === "completed") await appointmentsApi.complete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landlord-appointments"] }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Viewing Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {(data as any[]).filter((a: any) => a.status === "pending").length} pending · Respond to tenant viewing requests.
        </p>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48 rounded-xl">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="declined">Declined</SelectItem>
        </SelectContent>
      </Select>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load appointments: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (data as any[]).length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No viewing requests</p>
          <p className="text-xs mt-1">When tenants book a viewing on your listings, they'll appear here.</p>
        </div>
      )}

      <div className="space-y-4">
        {(data as any[]).map((a) => {
          const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending;
          const listing = a.listings as any;
          const student = a.users as any;
          const dateStr = a.scheduled_date
            ? new Date(a.scheduled_date).toLocaleDateString("en-CM", { weekday: "long", day: "numeric", month: "long" })
            : "Date TBD";
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-foreground">{listing?.title ?? "Property viewing"}</p>
                  {listing?.display_address && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {listing.display_address}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <Calendar className="h-3 w-3 inline mr-1" />{dateStr}
                    {a.slot && <span className="ml-2">· {a.slot}</span>}
                  </p>
                  {student && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <User className="h-3 w-3" /> {student.full_name ?? student.email}
                    </p>
                  )}
                </div>
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full shrink-0", cfg.color)}>
                  {cfg.label}
                </span>
              </div>

              {a.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl h-8 gap-1.5 text-xs"
                    onClick={() => updateStatus.mutate({ id: a.id, status: "confirmed" })}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-8 gap-1.5 text-xs text-destructive border-destructive/30"
                    onClick={() => updateStatus.mutate({ id: a.id, status: "declined" })}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              )}

              {a.status === "confirmed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-8 text-xs"
                  onClick={() => updateStatus.mutate({ id: a.id, status: "completed" })}
                  disabled={updateStatus.isPending}
                >
                  Mark as completed
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
