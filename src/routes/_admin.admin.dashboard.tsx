import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NjangaRent" }] }),
  component: AdminDashboard,
});

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn:  adminApi.getDashboard,
    refetchInterval: 60_000,
  });

  const stats = data?.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">NjangaRent platform overview</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active listings"     value={stats?.activeListings ?? 0}        icon={<Building2    className="h-4 w-4" aria-hidden="true" />} />
          <StatCard label="Active users"        value={stats?.activeUsers ?? 0}           icon={<Users        className="h-4 w-4" aria-hidden="true" />} />
          <StatCard label="Pending verifications" value={stats?.pendingVerifications ?? 0} icon={<Users       className="h-4 w-4" aria-hidden="true" />} />
          <StatCard label="Revenue (this month)" value={formatXAF(stats?.paymentsThisMonthXaf ?? 0)} icon={<CreditCard className="h-4 w-4" aria-hidden="true" />} />
          <StatCard label="Flagged listings"   value={stats?.flaggedListings ?? 0}        icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />} />
          <StatCard label="Payments this month" value={stats?.paymentsThisMonth ?? 0}    icon={<CreditCard className="h-4 w-4" aria-hidden="true" />} />
          <StatCard label="Pending landlords"  value={stats?.pendingLandlords ?? 0}       icon={<Users        className="h-4 w-4" aria-hidden="true" />} />
          <StatCard label="Pending students"   value={stats?.pendingStudents ?? 0}        icon={<Users        className="h-4 w-4" aria-hidden="true" />} />
        </div>
      )}

      {/* Action shortcuts */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/admin/verifications/landlords", label: "Review landlords",  icon: Users },
            { to: "/admin/verifications/students",  label: "Review students",   icon: Users },
            { to: "/admin/listings",                label: "Moderate listings",  icon: Building2 },
            { to: "/admin/payments",                label: "View payments",      icon: CreditCard },
          ].map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl">
              <Link to={to}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
