import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar } from "lucide-react";
import { appointmentsApi } from "@/api/appointments.api";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { AppointmentStatus } from "@/api/appointments.api";

export const Route = createFileRoute("/_landlord/landlord/appointments")({
  head: () => ({ meta: [{ title: "Appointments — NjangaRent" }] }),
  component: LandlordAppointments,
});

function LandlordAppointments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "landlord", statusFilter],
    queryFn:  () => appointmentsApi.list(statusFilter !== "all" ? { status: statusFilter } : undefined),
  });

  const respondMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "confirm" | "decline" }) =>
      appointmentsApi.respond(id, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments", "landlord"] }),
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => appointmentsApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments", "landlord"] }),
  });

  const appointments = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Viewing Requests</h1>
        <p className="text-sm text-muted-foreground">Respond to tenant viewing requests.</p>
      </div>

      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AppointmentStatus | "all")}>
        <SelectTrigger id="landlord-appt-filter" className="w-48 rounded-xl" aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="rescheduled">Rescheduled</SelectItem>
          <SelectItem value="declined">Declined</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {isLoading && (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && appointments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No appointments yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {appointments.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            role="landlord"
            onConfirm={(id) => respondMut.mutate({ id, action: "confirm" })}
            onDecline={(id) => respondMut.mutate({ id, action: "decline" })}
            onComplete={(id) => completeMut.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
