// Landlord Notifications — backend API (no direct Supabase calls)
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, Loader2, AlertTriangle } from "lucide-react";
import { notificationsApi } from "@/api/notifications.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_landlord/landlord/notifications")({
  head: () => ({ meta: [{ title: "Notifications — NjangaRent" }] }),
  component: NotificationsPage,
});

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  appointment_confirmed: { label: "Visit confirmed",   color: "bg-emerald-100 text-emerald-700" },
  appointment_pending:   { label: "New visit request", color: "bg-amber-100 text-amber-700"   },
  payment:               { label: "Payment",           color: "bg-blue-100 text-blue-700"     },
  listing_approved:      { label: "Listing approved",  color: "bg-emerald-100 text-emerald-700" },
  listing_flagged:       { label: "Listing flagged",   color: "bg-red-100 text-red-700"       },
  general:               { label: "Notice",            color: "bg-muted text-muted-foreground"  },
};

function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list({ limit: 50 }),
    refetchInterval: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load notifications: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <BellOff className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-xs mt-1">You'll be notified about viewing requests, payments, and listing updates.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type ?? "general"] ?? TYPE_CONFIG.general;
          const date = n.created_at
            ? new Date(n.created_at).toLocaleDateString("en-CM", { day: "numeric", month: "short", year: "numeric" })
            : "—";
          return (
            <div
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={cn(
                "rounded-xl border p-4 flex items-start gap-3 cursor-pointer transition-colors",
                n.read
                  ? "bg-card border-border opacity-70"
                  : "bg-card border-primary/20 hover:border-primary/40",
              )}
            >
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", cfg.color)}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm", n.read ? "text-muted-foreground" : "font-semibold text-foreground")}>
                    {n.message ?? n.title ?? "New notification"}
                  </p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={cn("text-[10px] rounded-full border-0", cfg.color)}>
                    {cfg.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
