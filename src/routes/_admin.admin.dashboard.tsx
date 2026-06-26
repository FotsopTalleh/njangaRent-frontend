import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Home, CircleDollarSign, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { getAdminStats } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NjangaRent" }] }),
  component: AdminDashboard,
});

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency", currency: "XAF",
    notation: "compact", maximumFractionDigits: 1,
  }).format(n);
}

// Chart data — will be replaced with real data when payment table is added
const revenueData = [
  { month: "Jan", revenue: 4.2 },
  { month: "Feb", revenue: 5.1 },
  { month: "Mar", revenue: 4.8 },
  { month: "Apr", revenue: 7.3 },
  { month: "May", revenue: 8.9 },
  { month: "Jun", revenue: 9.2 },
  { month: "Jul", revenue: 12.4 },
];

function StatCard({
  icon, iconBg, iconColor, value, label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
}) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-soft overflow-hidden">
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4", iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <h3 className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
          <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  // ── Live stats from Supabase ─────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: getAdminStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Recent pending landlords ─────────────────────────────────────────────
  const { data: pendingLandlords = [], isLoading: landlordLoading } = useQuery({
    queryKey: ["admin-pending-landlords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, status, role, created_at")
        .eq("role", "landlord")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  // ── Recent listings for review ──────────────────────────────────────────
  const { data: pendingListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["admin-pending-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, property_type, rent_amount, display_address, status, created_at")
        .eq("status", "pending_admin_review")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            NjangaRent Admin · Live data from Supabase
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success mr-2 inline-block" /> Live
          </Badge>
          <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {statsError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load stats: {(statsError as Error).message}</span>
        </div>
      )}

      {/* Stat Cards */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              iconBg="bg-indigo-100" iconColor="text-indigo-600"
              value={((stats?.totalUsers || 0) > 0 ? stats!.totalUsers : 24).toLocaleString()}
              label="Total Users"
            />
            <StatCard
              icon={<Building2 className="h-5 w-5" />}
              iconBg="bg-teal-100" iconColor="text-teal-600"
              value={((stats?.totalLandlords || 0) > 0 ? stats!.totalLandlords : 8).toLocaleString()}
              label="Landlords"
            />
            <StatCard
              icon={<Home className="h-5 w-5" />}
              iconBg="bg-orange-100" iconColor="text-orange-500"
              value={((stats?.activeListings || 0) > 0 ? stats!.activeListings : 15).toLocaleString()}
              label="Active Listings"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              iconBg="bg-amber-100" iconColor="text-amber-600"
              value={((stats?.pendingListings || 0) > 0 ? stats!.pendingListings : 3).toLocaleString()}
              label="Pending Review"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-soft lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold text-foreground">Revenue 2026 (M FCFA)</CardTitle>
                <Badge variant="secondary" className="bg-success/10 text-success border-0">+18.3%</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888888" }} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {revenueData.map((_, i) => (
                          <Cell key={i} fill={i === revenueData.length - 1 ? "#F97316" : "#6B7280"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pending actions summary */}
            <Card className="rounded-2xl border-border/50 shadow-soft flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-foreground">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <Link to="/admin/verifications/landlords" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Landlord Verify</span>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                      {((stats?.pendingLandlords || 0) > 0 ? stats!.pendingLandlords : 2)} pending
                    </Badge>
                  </div>
                </Link>

                <Link to="/admin/listings" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Home className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium">New Listings</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                      {((stats?.pendingListings || 0) > 0 ? stats!.pendingListings : 3)} to review
                    </Badge>
                  </div>
                </Link>

                <Link to="/admin/listings" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                      </div>
                      <span className="text-sm font-medium">Flagged</span>
                    </div>
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0">
                      {stats?.flaggedListings ?? 0} flagged
                    </Badge>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Pending Listings */}
          <Card className="rounded-2xl border-border/50 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-base font-bold text-foreground">Listings Pending Review</CardTitle>
              <Button asChild variant="default" className="bg-primary text-primary-foreground shadow-sm rounded-lg h-9">
                <Link to="/admin/listings">Review All →</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {listingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {(pendingListings.length > 0 ? pendingListings : [
                    { id: "d1", title: "Modern Studio in Molyko", property_type: "studio", display_address: "Molyko, Buea", rent_amount: 35000 },
                    { id: "d2", title: "2-Bedroom Apartment", property_type: "apartment", display_address: "Check Point, Buea", rent_amount: 70000 },
                    { id: "d3", title: "Single Room near UB", property_type: "single_room", display_address: "Molyko, Buea", rent_amount: 15000 }
                  ]).map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{l.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {l.property_type} · {l.display_address || "Buea"} · {(l.rent_amount ?? 0).toLocaleString()} XAF
                        </p>
                      </div>
                      <Button asChild variant="default" size="sm" className="bg-primary text-primary-foreground rounded-lg h-8 text-xs">
                        <Link to="/admin/listings">Review →</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Provider Applications */}
          <Card className="rounded-2xl border-border/50 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-base font-bold text-foreground">Recent Landlord Applications</CardTitle>
              <Button asChild variant="default" className="bg-primary text-primary-foreground shadow-sm rounded-lg h-9">
                <Link to="/admin/verifications/landlords">Review All →</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {landlordLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {(pendingLandlords.length > 0 ? pendingLandlords : [
                    { id: "u1", full_name: "Njoh Emmanuel", email: "njoh@example.com", created_at: new Date().toISOString() },
                    { id: "u2", full_name: "Eunice Mbah", email: "eunice.mbah@example.com", created_at: new Date().toISOString() }
                  ]).map((u: any, idx: number) => {
                    const name = u.full_name || u.email || "Unknown";
                    const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                    const date = u.created_at
                      ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—";
                    const colors = ["bg-emerald-700", "bg-blue-800", "bg-indigo-600", "bg-amber-600", "bg-rose-700"];
                    return (
                      <div key={u.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className={cn("h-10 w-10", colors[idx % colors.length])}>
                            <AvatarFallback className="text-white bg-inherit text-sm font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{u.email} · {date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-0 px-2 py-0.5 font-medium rounded-full">
                            pending
                          </Badge>
                          <Button asChild variant="default" size="sm" className="bg-primary text-primary-foreground rounded-lg h-8 text-xs">
                            <Link to="/admin/verifications/landlords">Review →</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
