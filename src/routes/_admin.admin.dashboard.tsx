import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Home, CircleDollarSign, Loader2, ArrowUp, AlertTriangle } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NjangaRent" }] }),
  component: AdminDashboard,
});

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", notation: "compact", maximumFractionDigits: 1 }).format(n);
}

// Mock data for the Revenue Chart
const revenueData = [
  { month: "Jan", revenue: 4.2 },
  { month: "Feb", revenue: 5.1 },
  { month: "Mar", revenue: 4.8 },
  { month: "Apr", revenue: 7.3 },
  { month: "May", revenue: 8.9 },
  { month: "Jun", revenue: 9.2 },
  { month: "Jul", revenue: 12.4 }, // Highlighted
];

function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
    refetchInterval: 60_000,
  });

  const { data: landlordsData, isLoading: landlordsLoading } = useQuery({
    queryKey: ["admin-recent-landlords"],
    queryFn: () => adminApi.getLandlordVerifications(1, 5),
    refetchInterval: 60_000,
  });

  const stats = statsData?.data;
  const recentLandlords = landlordsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">NjangaRent · May 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success mr-2" /> Live
          </Badge>
          <Button variant="default" className="rounded-full shadow-soft bg-primary text-primary-foreground">
            Pending <Badge className="ml-2 bg-amber-500 text-white border-0 hover:bg-amber-600">3</Badge>
          </Button>
        </div>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <>
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card className="rounded-2xl border-border/50 shadow-soft overflow-hidden">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.activeUsers ? stats.activeUsers.toLocaleString() : "0"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Total Users</p>
                </div>
              </CardContent>
            </Card>

            {/* Active Providers */}
            <Card className="rounded-2xl border-border/50 shadow-soft overflow-hidden">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center mb-4">
                  <Building2 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.pendingLandlords ?? "0"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Active Providers</p>
                </div>
              </CardContent>
            </Card>

            {/* Total Listings */}
            <Card className="rounded-2xl border-border/50 shadow-soft overflow-hidden">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <Home className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.activeListings ?? "0"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Total Listings</p>
                </div>
              </CardContent>
            </Card>

            {/* FCFA Processed */}
            <Card className="rounded-2xl border-border/50 shadow-soft overflow-hidden">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <CircleDollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.paymentsThisMonthXaf ? formatXAF(stats.paymentsThisMonthXaf).replace("FCFA", "").trim() : "0"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mb-1">FCFA Processed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Row: Charts & Pending Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Chart */}
            <Card className="rounded-2xl border-border/50 shadow-soft lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold text-foreground">Revenue 2026 (M FCFA)</CardTitle>
                <Badge variant="secondary" className="bg-success/10 text-success border-0">+18.3%</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === revenueData.length - 1 ? "#F97316" : "#6B7280"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card className="rounded-2xl border-border/50 shadow-soft flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-foreground">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Verifications</span>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                    {stats?.pendingVerifications || 3} pending
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Home className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium">New Listings</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                    8 to review
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <span className="text-sm font-medium">Reports</span>
                  </div>
                  <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0">
                    {stats?.flaggedListings || 2} flagged
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row: Recent Provider Applications */}
          <Card className="rounded-2xl border-border/50 shadow-soft mt-4">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-base font-bold text-foreground">Recent Provider Applications</CardTitle>
              <Button variant="default" className="bg-primary text-primary-foreground shadow-sm rounded-lg h-9">
                Review All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {landlordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentLandlords.length > 0 ? (
                <div className="flex flex-col">
                  {recentLandlords.map((landlord: any, idx: number) => {
                    const name = landlord.name || landlord.email || "Unknown Provider";
                    const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                    const date = landlord.createdAt ? new Date(landlord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "May 23, 2026";
                    const role = "Landlord";
                    const address = landlord.metadata?.address || "Buea";
                    const status = landlord.status || "pending";
                    
                    return (
                      <div key={landlord.id || idx} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className={cn("h-10 w-10", idx === 0 ? "bg-emerald-700" : idx === 1 ? "bg-blue-800" : idx === 2 ? "bg-indigo-600" : "bg-amber-600")}>
                            <AvatarImage src={landlord.avatarUrl} />
                            <AvatarFallback className="text-white bg-inherit">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{role} · {address} · {date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {status === "pending" ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-0 px-2 py-0.5 font-medium rounded-full">
                              pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-rose-100 text-rose-700 border-0 px-2 py-0.5 font-medium rounded-full">
                              rejected
                            </Badge>
                          )}
                          <Button asChild variant="default" className="bg-primary text-primary-foreground rounded-lg h-9">
                            <Link to="/admin/verifications/landlords">
                              Review &rarr;
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">No pending applications</h3>
                  <p className="text-xs text-muted-foreground mt-1">All provider applications have been reviewed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
