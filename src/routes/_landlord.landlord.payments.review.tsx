// Landlord Payment Review — backend API (no direct Supabase calls)
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, Loader2, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { paymentsApi } from "@/api/payments.api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_landlord/landlord/payments/review")({
  head: () => ({ meta: [{ title: "Payment Review — NjangaRent" }] }),
  component: PaymentReviewPage,
});

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  initiated: { label: "Pending",   color: "bg-amber-100 text-amber-700",    icon: Clock        },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  failed:    { label: "Failed",    color: "bg-red-100 text-red-700",        icon: XCircle      },
};

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

function PaymentReviewPage() {
  // Fetch all payments for landlord via backend (raw SQL, bypasses RLS)
  const { data, isLoading, error } = useQuery({
    queryKey: ["landlord-payments"],
    queryFn: () => paymentsApi.list({ limit: 100 }),
  });

  const payments = data?.data ?? [];

  const totalConfirmed = payments
    .filter((p: any) => p.status === "approved")
    .reduce((s, p) => s + (p.amountVerified ?? p.amountClaimed ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Payment Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Campay Mobile Money transactions for your listings.</p>
        </div>
        {totalConfirmed > 0 && (
          <div className="rounded-xl border border-border bg-card px-5 py-3">
            <p className="text-xs text-muted-foreground">Total confirmed</p>
            <p className="text-xl font-bold">{formatXAF(totalConfirmed)}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load payments: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (payments as any[]).length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
          <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No payments yet</p>
          <p className="text-xs mt-1">When tenants pay for your listings, transactions will appear here.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {(payments as any[]).map((p, i) => {
          const status = (p.status ?? "initiated") as string;
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.initiated;
          const Icon = cfg.icon;
          const date = p.created_at
            ? new Date(p.created_at).toLocaleDateString("en-CM", { day: "2-digit", month: "short", year: "numeric" })
            : "—";
          return (
            <div key={p.id} className={cn("flex items-center gap-4 px-5 py-3.5", i !== 0 && "border-t border-border")}>
              <span className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", cfg.color)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{p.payment_type ?? "Payment"}</p>
                <p className="text-xs text-muted-foreground">{date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatXAF(p.amount_xaf ?? p.amount ?? 0)}</p>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
