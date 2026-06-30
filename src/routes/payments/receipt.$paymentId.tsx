import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Home, Download, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/payments/receipt/$paymentId")({
  head: () => ({ meta: [{ title: "Payment Confirmed — NjangaRent" }] }),
  component: ReceiptPage,
  validateSearch: (s: Record<string, unknown>) => ({
    amount: Number(s.amount) || 0,
    title: (s.title as string) || "Rent Payment",
    provider: (s.provider as string) || "MTN Mobile Money",
  }),
});

function ReceiptPage() {
  const { paymentId } = Route.useParams();
  const { amount, title, provider } = Route.useSearch();
  const router = useRouter();
  const svgRef = useRef<SVGCircleElement>(null);

  const displayAmount = amount || 35000;
  const now = new Date();
  const providerLabel = provider === "mtn" ? "MTN Mobile Money" : provider === "orange" ? "Orange Money" : provider;
  const transactionId = `NJR-${paymentId?.slice(0, 8)?.toUpperCase() || "XXXXXXXX"}`;

  // Animate the checkmark circle on mount
  useEffect(() => {
    if (!svgRef.current) return;
    const circle = svgRef.current;
    const length = circle.getTotalLength?.() || 283;
    circle.style.strokeDasharray = String(length);
    circle.style.strokeDashoffset = String(length);
    circle.style.transition = "stroke-dashoffset 0.8s ease 0.2s";
    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = "0";
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ backgroundColor: "#F9F7F2", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Print-only styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .receipt-content { animation: fadeIn 0.4s ease both; }
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-content { animation: none !important; box-shadow: none !important; }
        }
      `}</style>

      {/* Header (no-print) */}
      <div className="no-print" style={{
        backgroundColor: "#F9F7F2",
        padding: "16px 16px",
        paddingTop: "max(16px, env(safe-area-inset-top))",
      }} />

      {/* Main Receipt */}
      <div className="receipt-content" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px 100px" }}>
        
        {/* Animated Checkmark */}
        <div style={{ marginBottom: 20, position: "relative" }}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="40" fill="#EAF4EE" />
            <circle
              ref={svgRef}
              cx="44" cy="44" r="40"
              fill="none"
              stroke="#1B4332"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <polyline
              points="26,44 38,56 62,32"
              fill="none"
              stroke="#1B4332"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#1A1A18", textAlign: "center" }}>
          Payment confirmed
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6B6B68", textAlign: "center" }}>
          Your rent has been paid successfully
        </p>

        {/* Receipt Card */}
        <div style={{
          width: "100%", maxWidth: 400,
          backgroundColor: "#FFFFFF",
          borderRadius: 16, border: "0.5px solid #E8E4DC",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}>
          {/* Amount header */}
          <div style={{ backgroundColor: "#1B4332", padding: "20px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Amount paid</p>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#FFFFFF" }}>
              ₣{displayAmount.toLocaleString()}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>FCFA</p>
          </div>

          {/* Details */}
          <div style={{ padding: "16px 16px" }}>
            {[
              { label: "Property", value: title },
              { label: "Period", value: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) },
              { label: "Transaction ID", value: transactionId },
              { label: "Provider", value: providerLabel },
              { label: "Date", value: now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
              { label: "Status", value: "Confirmed ✓" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                paddingBottom: 12, marginBottom: 12, borderBottom: "0.5px solid #E8E4DC",
              }}>
                <span style={{ fontSize: 13, color: "#6B6B68", fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: "#1A1A18", fontWeight: 600, textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Divider with perforation effect */}
          <div style={{ position: "relative", margin: "0 -1px", borderTop: "1.5px dashed #E8E4DC" }}>
            <div style={{
              position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)",
              width: 24, height: 24, borderRadius: "50%", backgroundColor: "#F9F7F2",
              border: "0.5px solid #E8E4DC",
            }} />
            <div style={{
              position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
              width: 24, height: 24, borderRadius: "50%", backgroundColor: "#F9F7F2",
              border: "0.5px solid #E8E4DC",
            }} />
          </div>

          <div style={{ padding: "14px 16px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#A8A8A5" }}>NjangaRent · Buea, Cameroon</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#A8A8A5" }}>Powered by Campay</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print" style={{ width: "100%", maxWidth: 400, marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{
              width: "100%", height: 48, borderRadius: 12,
              backgroundColor: "#1B4332", color: "#FFFFFF",
              fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Download size={17} /> Download receipt
          </button>
          <button
            onClick={() => router.navigate({ to: "/explore" })}
            style={{
              width: "100%", height: 48, borderRadius: 12,
              backgroundColor: "#FFFFFF", color: "#1A1A18",
              fontSize: 15, fontWeight: 600,
              border: "0.5px solid #E8E4DC", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Home size={17} /> Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
