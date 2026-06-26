import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, Clock, TrendingUp,
  Plus, UserPlus, FileCheck, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listingsApi } from "@/api/listings.api";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_landlord/landlord/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NjangaRent Landlord" }] }),
  component: LandlordDashboard,
});

function LandlordDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "";

  // Fetch landlord's own listings via backend (raw SQL, bypasses RLS)
  const listingsQ = useQuery({
    queryKey: ["landlord-listings-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await listingsApi.getMyListings();
      return res.data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const listings = listingsQ.data ?? [];
  const totalListings  = listings.length;
  const activeListings = listings.filter((l: any) => l.status === "active").length;
  const pendingListings = listings.filter((l: any) => l.status === "pending_admin_review").length;
  const recentListings = listings.slice(0, 5);

  const stats = [
    { label: "Total Listings",    value: totalListings,   icon: Building2 },
    { label: "Active Listings",   value: activeListings,  icon: TrendingUp },
    { label: "Under Review",      value: pendingListings,  icon: Clock, accent: pendingListings > 0 },
    { label: "Tenants",           value: "—",              icon: Users },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening across your listings.
        </p>
      </header>

      {listingsQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      s.accent
                        ? "bg-amber-100 text-amber-600"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </section>

          <section className="grid lg:grid-cols-3 gap-6">
            {/* Recent listings */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Listings</h2>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link to="/landlord/listings">
                    View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>

              {recentListings.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">
                  No listings yet.{" "}
                  <Link to="/landlord/listings/create" className="text-primary underline underline-offset-2">
                    Create your first listing
                  </Link>{" "}
                  to get started.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentListings.map((l: any) => {
                    const statusColor =
                      l.status === "active"
                        ? "text-emerald-600"
                        : l.status === "pending_admin_review"
                        ? "text-amber-600"
                        : "text-muted-foreground";
                    const statusLabel =
                      l.status === "active"           ? "Active"
                      : l.status === "pending_admin_review" ? "Under review"
                      : l.status === "deactivated"    ? "Deactivated"
                      : l.status ?? "—";
                    const date = l.created_at
                      ? new Date(l.created_at).toLocaleDateString("en-CM", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : "—";
                    return (
                      <li
                        key={l.id}
                        className="py-3 flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{l.title}</p>
                            <p className="text-xs text-muted-foreground">{date}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ml-3 shrink-0 ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <QuickAction to="/landlord/listings/create" icon={Plus}      label="New listing"       />
                <QuickAction to="/landlord/listings"        icon={Building2} label="Manage listings"   />
                <QuickAction to="/landlord/notifications"   icon={FileCheck} label="Notifications"
                  badge={pendingListings > 0 ? String(pendingListings) : undefined}
                />
              </div>

              {totalListings === 0 && (
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-medium text-primary">Get started</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Create your first listing to start attracting tenants on NjangaRent.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function QuickAction({
  to, icon: Icon, label, badge,
}: {
  to: string;
  icon: typeof Plus;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
    >
      <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
          {badge}
        </span>
      )}
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
