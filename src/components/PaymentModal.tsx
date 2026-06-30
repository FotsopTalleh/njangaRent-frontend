import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { campayPaymentsApi, type CampayPayment, type PaymentType } from "@/api/campayPayments.api";
import { socketService } from "@/services/socket";
import { useAuthStore } from "@/store/authStore";

interface PaymentModalProps {
  listingId: string;
  listingTitle: string;
  suggestedAmount: number;
  paymentType?: PaymentType;
  onClose: () => void;
}

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", {
    style:    "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PaymentModal({
  listingId,
  listingTitle,
  suggestedAmount,
  paymentType = "rent",
  onClose,
}: PaymentModalProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [phone,   setPhone]   = useState("");
  const [amount,  setAmount]  = useState(String(suggestedAmount));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [payment, setPayment] = useState<CampayPayment | null>(null);
  const [status,  setStatus]  = useState<"idle" | "pending" | "confirmed" | "failed">("idle");

  // Listen for real-time status updates on this payment
  useEffect(() => {
    if (!payment) return;
    const unsub = socketService.onPaymentStatusUpdate((data) => {
      if (data.paymentId === payment.id) {
        setStatus(data.status === "confirmed" ? "confirmed" : "failed");
      }
    });

    // Fallback polling (especially for local dev without ngrok webhooks)
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      if (status !== "pending") return;
      pollCount++;
      if (pollCount > 15) {
        clearInterval(pollInterval);
        setStatus("failed");
        return;
      }
      try {
        const res = await campayPaymentsApi.getStatus(payment.transactionId);
        const s = (res as any)?.data?.status;
        if (s === "SUCCESSFUL" || s === "success" || s === "completed") {
          setStatus("confirmed");
          clearInterval(pollInterval);
        } else if (s === "FAILED" || s === "failed" || s === "error") {
          setStatus("failed");
          clearInterval(pollInterval);
        }
      } catch (e) {
        // Ignore poll errors
      }
    }, 3000);

    return () => {
      unsub();
      clearInterval(pollInterval);
    };
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount);
    if (!phone.trim()) return setError("Phone number is required.");
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setError("Enter a valid amount.");

    setLoading(true);
    try {
      const res = await campayPaymentsApi.initiate({
        listingId,
        amount:      parsedAmount,
        phone:       phone.trim(),
        paymentType,
      });
      setPayment(res.data);
      setStatus("pending");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Payment initiation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-elevated border border-border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="payment-modal-title" className="font-semibold text-base">
              {paymentType === "deposit" ? "Pay Deposit" : "Pay Rent"} via Campay
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[260px]">
              {listingTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close payment modal"
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* States */}
        {status === "confirmed" && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-14 w-14 text-success mx-auto mb-3" aria-hidden="true" />
            <p className="font-semibold text-lg">Payment confirmed</p>
            <p className="text-sm text-muted-foreground mt-1">
              {payment && formatXAF(payment.amountXaf)} received successfully.
            </p>
            <Button className="mt-5 w-full" onClick={onClose}>Done</Button>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center py-8">
            <XCircle className="h-14 w-14 text-destructive mx-auto mb-3" aria-hidden="true" />
            <p className="font-semibold text-lg">Payment failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              The payment could not be completed. Please try again.
            </p>
            <Button variant="outline" className="mt-5 w-full" onClick={() => setStatus("idle")}>
              Try again
            </Button>
          </div>
        )}

        {status === "pending" && (
          <div className="text-center py-8">
            <Loader2 className="h-14 w-14 text-primary mx-auto mb-3 animate-spin" aria-hidden="true" />
            <p className="font-semibold text-lg">Awaiting confirmation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check your phone ({phone}) and approve the Campay prompt.
            </p>
          </div>
        )}

        {status === "idle" && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="payment-phone" className="text-sm font-medium">
                Mobile Money Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  id="payment-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 677000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-9 rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-describedby="payment-phone-hint"
                />
              </div>
              <p id="payment-phone-hint" className="text-xs text-muted-foreground">
                MTN or Orange Cameroon number
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="payment-amount" className="text-sm font-medium">
                Amount (XAF)
              </label>
              <input
                id="payment-amount"
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Payment amount in XAF"
              />
            </div>

            {error && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground space-y-0.5">
              <p>Powered by Campay Mobile Money</p>
              <p>You will receive a payment prompt on your phone.</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                `Pay ${formatXAF(parseFloat(amount) || suggestedAmount)}`
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
