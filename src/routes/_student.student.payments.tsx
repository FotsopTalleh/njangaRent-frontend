import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";
import { nkwaPaymentsApi, type NkwaStatus } from "@/api/nkwaPayments.api";

export const Route = createFileRoute("/_student/student/payments")({
  head: () => ({ meta: [{ title: "My Payments — NjangaRent" }] }),
  component: StudentPayments,
});

const STATUS_CONFIG: Record<NkwaStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  initiated: { label: "Pending",   color: "text-warning bg-warning/10",          icon: Clock        },
  confirmed: { label: "Confirmed", color: "text-success bg-success/10",          icon: CheckCircle2 },
  failed:    { label: "Failed",    color: "text-destructive bg-destructive/10",  icon: XCircle      },
};

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

function StudentPayments() {
  const { data, isLoading } = useQuery({
    queryKey: ["nkwa-payments", "student"],
    queryFn:  nkwaPaymentsApi.list,
  });

  const payments = data?.data ?? [];
  const totalConfirmed = payments.filter((p) => p.nkwaStatus === "confirmed").reduce((sum, p) => sum + p.amountXaf, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Payment History</h1>
        <p className="text-sm text-muted-foreground">All payments made via Nkwa Mobile Money.</p>
      </div>

      {/* Total confirmed */}
      {totalConfirmed > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total paid</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{formatXAF(totalConfirmed)}</p>
          </div>
          <CreditCard className="h-8 w-8 text-primary opacity-60" aria-hidden="true" />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!isLoading && payments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No payments yet. Pay your deposit or rent from any listing page.</p>
        </div>
      )}

      <div className="space-y-3">
        {payments.map((p) => {
          const cfg  = STATUS_CONFIG[p.nkwaStatus];
          const Icon = cfg.icon;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card px-4 py-3.5 flex items-center gap-4">
              <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{p.paymentType} payment</p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(p.initiatedAt).toLocaleDateString("en-CM", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatXAF(p.amountXaf)}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
