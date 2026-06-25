import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, CreditCard, BookmarkCheck, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { appointmentsApi } from "@/api/appointments.api";
import { nkwaPaymentsApi } from "@/api/nkwaPayments.api";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";

export const Route = createFileRoute("/_student/student/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NjangaRent" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: appts } = useQuery({
    queryKey: ["appointments", "student"],
    queryFn:  () => appointmentsApi.list({ page: 1, limit: 50 }),
  });

  const { data: payments } = useQuery({
    queryKey: ["nkwa-payments", "student"],
    queryFn:  () => nkwaPaymentsApi.list(),
  });

  const upcoming = (appts?.data ?? []).filter(
    (a) => a.status === "confirmed" || a.status === "pending",
  ).slice(0, 3);

  const recentPayments = (payments?.data ?? []).slice(0, 3);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find your perfect home across Buea.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Upcoming appointments"
          value={(appts?.data ?? []).filter((a) => a.status === "confirmed").length}
          icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Pending appointments"
          value={(appts?.data ?? []).filter((a) => a.status === "pending").length}
          icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Payments made"
          value={(payments?.data ?? []).filter((p) => p.nkwaStatus === "confirmed").length}
          icon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Saved listings"
          value={0}
          icon={<BookmarkCheck className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl">
            <Link to="/explore">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              Browse listings
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl">
            <Link to="/student/appointments">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              Book a viewing
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl">
            <Link to="/student/payments">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              Payment history
            </Link>
          </Button>
        </div>
      </div>

      {/* Upcoming appointments */}
      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="upcoming-heading" className="font-semibold text-sm text-foreground">
              Upcoming appointments
            </h2>
            <Link to="/student/appointments" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{a.proposedDate}</p>
                  <p className="text-xs text-muted-foreground capitalize">{a.proposedSlot} slot</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.status === "confirmed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
