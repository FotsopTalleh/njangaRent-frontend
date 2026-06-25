import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_admin/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Admin" }] }),
  component: AdminPayments,
});

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  initiated: { icon: Clock,        color: "text-warning bg-warning/10" },
  confirmed: { icon: CheckCircle2, color: "text-success bg-success/10" },
  failed:    { icon: XCircle,      color: "text-destructive bg-destructive/10" },
};

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", statusFilter],
    queryFn:  () => adminApi.getPayments(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const payments = (data?.data ?? []) as Record<string, unknown>[];
  const totalXAF = payments
    .filter((p) => p.nkwaStatus === "confirmed")
    .reduce((s, p) => s + ((p.amountXaf as number) ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">All Nkwa Mobile Money transactions.</p>
        </div>
        {totalXAF > 0 && (
          <div className="rounded-xl border border-border bg-card px-5 py-3 text-right">
            <p className="text-xs text-muted-foreground">Confirmed total</p>
            <p className="text-xl font-bold text-foreground">{formatXAF(totalXAF)}</p>
          </div>
        )}
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger id="admin-payment-filter" className="w-44 rounded-xl" aria-label="Filter by payment status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="initiated">Initiated</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      {isLoading && (
        <div className="flex justify-center py-16" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && payments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No payments found.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {payments.map((p, i) => {
          const status = (p.nkwaStatus as string) ?? "initiated";
          const cfg    = STATUS_ICONS[status] ?? STATUS_ICONS.initiated;
          const Icon   = cfg.icon;
          return (
            <div
              key={p.id as string}
              className={`flex items-center gap-4 px-5 py-3.5 ${i !== 0 ? "border-t border-border" : ""}`}
            >
              <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{(p.paymentType as string) ?? "payment"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Phone: {p.phone as string} &bull; Ref: {p.nkwaReference as string}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.initiatedAt ? new Date(p.initiatedAt as string).toLocaleString("en-CM") : "—"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatXAF((p.amountXaf as number) ?? 0)}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
