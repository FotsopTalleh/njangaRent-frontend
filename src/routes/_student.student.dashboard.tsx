// Student/Tenant Dashboard — live data from Supabase
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, CreditCard, BookmarkCheck, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_student/student/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NjangaRent" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "";

  // Upcoming appointments from Supabase
  const { data: apptData = [] } = useQuery({
    queryKey: ["student-appointments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("student_id", user.id)
        .in("status", ["confirmed", "pending"])
        .order("scheduled_date", { ascending: true })
        .limit(3);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Saved listings count from Supabase
  const { data: savedCount = 0 } = useQuery({
    queryKey: ["saved-listings-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("saved_listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  // Recent payments count
  const { data: paymentsCount = 0 } = useQuery({
    queryKey: ["student-payments-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("nkwa_payments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const stats = [
    { label: "Upcoming Visits",  value: apptData.length, icon: Calendar,      to: "/student/appointments" },
    { label: "Saved Listings",   value: savedCount,       icon: BookmarkCheck, to: "/explore" },
    { label: "Payments Made",    value: paymentsCount,    icon: CreditCard,    to: "/student/payments" },
    { label: "Explore Listings", value: "Browse",         icon: Building2,     to: "/explore" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find your perfect home across Buea and Cameroon.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="block">
            <div className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Upcoming appointments */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Upcoming Appointments</h2>
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link to="/student/appointments">
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {apptData.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No upcoming appointments.{" "}
            <Link to="/explore" className="text-primary underline underline-offset-2">
              Explore listings
            </Link>{" "}
            to book your first viewing.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {apptData.map((a: any) => (
              <li key={a.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {a.scheduled_date
                        ? new Date(a.scheduled_date).toLocaleDateString("en-CM", { weekday: "short", day: "numeric", month: "short" })
                        : "Scheduled visit"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{a.status}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  a.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/explore">
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Explore Listings</p>
              <p className="text-xs text-muted-foreground">Browse available rentals</p>
            </div>
          </div>
        </Link>
        <Link to="/student/appointments">
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">My Appointments</p>
              <p className="text-xs text-muted-foreground">View scheduled viewings</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
