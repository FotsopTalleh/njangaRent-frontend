import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Calendar } from "lucide-react";
import { appointmentsApi } from "@/api/appointments.api";
import { listingsApi } from "@/api/listings.api";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppointmentStatus } from "@/api/appointments.api";

export const Route = createFileRoute("/_student/student/appointments")({
  head: () => ({ meta: [{ title: "My Appointments — NjangaRent" }] }),
  component: StudentAppointments,
});

function StudentAppointments() {
  const qc     = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookListingId, setBookListingId] = useState("");
  const [bookDate, setBookDate]     = useState("");
  const [bookSlot, setBookSlot]     = useState("morning");
  const [bookNote, setBookNote]     = useState("");
  const [bookError, setBookError]   = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "student", statusFilter],
    queryFn:  () => appointmentsApi.list(statusFilter !== "all" ? { status: statusFilter } : undefined),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["appointments", "student"] }),
  });

  const bookMut = useMutation({
    mutationFn: () => appointmentsApi.create({
      listingId:    bookListingId,
      proposedDate: bookDate,
      proposedSlot: bookSlot as "morning" | "afternoon" | "evening",
      studentNote:  bookNote,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", "student"] });
      setShowBookForm(false);
      setBookListingId(""); setBookDate(""); setBookSlot("morning"); setBookNote("");
    },
    onError: (err: { message?: string }) => setBookError(err?.message ?? "Booking failed."),
  });

  const appointments = data?.data ?? [];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-sm text-muted-foreground">Manage your property viewings.</p>
        </div>
        <Button size="sm" onClick={() => setShowBookForm((v) => !v)} className="gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Book viewing
        </Button>
      </div>

      {/* Book form */}
      {showBookForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">New viewing request</h2>

          <div className="space-y-1.5">
            <label htmlFor="appt-listing" className="text-sm font-medium">Listing ID</label>
            <input
              id="appt-listing"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Paste the listing ID from the listing page"
              value={bookListingId}
              onChange={(e) => setBookListingId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="appt-date" className="text-sm font-medium">Date</label>
              <input
                id="appt-date"
                type="date"
                min={tomorrowStr}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="appt-slot" className="text-sm font-medium">Time slot</label>
              <Select value={bookSlot} onValueChange={setBookSlot}>
                <SelectTrigger id="appt-slot" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am–12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm–4pm)</SelectItem>
                  <SelectItem value="evening">Evening (4pm–7pm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="appt-note" className="text-sm font-medium">Note to landlord (optional)</label>
            <textarea
              id="appt-note"
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Any questions or special requirements?"
              value={bookNote}
              onChange={(e) => setBookNote(e.target.value)}
            />
          </div>

          {bookError && (
            <p role="alert" className="text-sm text-destructive">{bookError}</p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBookForm(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              disabled={!bookListingId || !bookDate || bookMut.isPending}
              onClick={() => bookMut.mutate()}
              className="flex-1 rounded-xl"
            >
              {bookMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Request viewing"}
            </Button>
          </div>
        </div>
      )}

      {/* Status filter */}
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AppointmentStatus | "all")}>
        <SelectTrigger id="appt-filter" className="w-44 rounded-xl" aria-label="Filter appointments by status">
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
        <div className="flex items-center justify-center py-12" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && appointments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No appointments yet. Book your first viewing above.</p>
        </div>
      )}

      <div className="space-y-3">
        {appointments.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            role="student"
            onCancel={(id) => cancelMut.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
