import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, CheckCircle2, AlertCircle, User, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { campayPaymentsApi, type ListingInfo } from "@/api/campayPayments.api";

export const Route = createFileRoute("/payments/pay")({
  head: () => ({ meta: [{ title: "Pay Rent — NjangaRent" }] }),
  component: PayPage,
  validateSearch: (s: Record<string, unknown>) => ({
    listingId: (s.listingId as string) || "",
    leaseId: (s.leaseId as string) || "",
    amount: Number(s.amount) || 0,
    listingTitle: (s.listingTitle as string) || "",
  }),
});

type Provider = "mtn" | "orange";

function PayPage() {
  const router = useRouter();
  const { listingId, leaseId, amount, listingTitle } = Route.useSearch();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [waitingUSSD, setWaitingUSSD] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [listingInfo, setListingInfo] = useState<ListingInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollCount = useRef(0);

  const displayAmount = listingInfo?.rentAmount || amount || 35000;
  const displayTitle = listingInfo?.title || listingTitle || "Property";
  const currentMonth = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const isPhoneValid = phone.replace(/\s/g, "").length === 9 && phone.startsWith("6");
  const canPay = !!provider && isPhoneValid && agreementChecked && !isLoading;

  // Fetch listing + landlord info on mount
  useEffect(() => {
    if (!listingId) return;
    setInfoLoading(true);
    campayPaymentsApi.getListingInfo(listingId)
      .then((res) => setListingInfo(res.data))
      .catch(() => {/* non-fatal, fall back to search params */})
      .finally(() => setInfoLoading(false));
  }, [listingId]);

  const handlePay = async () => {
    if (!canPay) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await campayPaymentsApi.initiate({
        listingId,
        landlordId: listingInfo?.landlordId,
        amount: displayAmount,
        phone: phone.replace(/\s/g, ""),
        paymentType: "rent",
      });
      const data = res as any;

      setWaitingUSSD(true);
      pollCount.current = 0;

      const paymentId = data.data?.paymentId || data.paymentId;
      const reference = data.data?.reference || data.reference;

      if (data.data?.status === "failed") {
        setIsLoading(false);
        setError(data.data?.error || "Payment failed");
        return;
      }

      pollRef.current = setInterval(async () => {
        pollCount.current += 1;
        if (pollCount.current > 10) {
          clearInterval(pollRef.current!);
          setWaitingUSSD(false);
          setIsLoading(false);
          setError("No response received. Check your phone and try again.");
          return;
        }

        const statusRes = await campayPaymentsApi.getStatus(reference);
        const statusData = statusRes as any;
        const status = statusData?.data?.status;

        if (status === "SUCCESSFUL" || status === "success" || status === "completed") {
          clearInterval(pollRef.current!);
          router.navigate({
            to: "/payments/receipt/$paymentId",
            params: { paymentId },
            search: { amount: displayAmount, title: displayTitle, provider: provider! },
          });
        } else if (status === "FAILED" || status === "failed" || status === "error") {
          clearInterval(pollRef.current!);
          setWaitingUSSD(false);
          setIsLoading(false);
          setError("Payment failed. Please try again.");
        }
      }, 3000);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div style={{ backgroundColor: "#F9F7F2", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "0.5px solid #E8E4DC",
        padding: "16px 16px",
        paddingTop: "max(16px, env(safe-area-inset-top))",
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.history.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}
        >
          <ArrowLeft size={22} color="#1A1A18" />
        </button>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1A1A18" }}>Pay Rent</h1>
      </div>

      <div style={{ padding: "24px 16px 120px" }}>
        {/* Listing Summary */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16, border: "0.5px solid #E8E4DC",
          padding: "20px 16px", marginBottom: 16,
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6B6B68", fontWeight: 500 }}>{displayTitle}</p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#A8A8A5" }}>{currentMonth}</p>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 700, color: "#1B4332" }}>
            ₣{displayAmount.toLocaleString()}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B6B68" }}>FCFA due</p>
        </div>

        {/* Paying To — Landlord card */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16, border: "0.5px solid #E8E4DC",
          padding: "16px", marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#6B6B68", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Paying to
          </p>
          {infoLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite", color: "#6B6B68" }} />
              <span style={{ fontSize: 13, color: "#6B6B68" }}>Loading landlord info...</span>
            </div>
          ) : listingInfo ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                backgroundColor: "#1B4332", color: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {listingInfo.landlordName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1A1A18" }}>
                  {listingInfo.landlordName}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <Phone size={12} color="#6B6B68" />
                  <p style={{ margin: 0, fontSize: 13, color: "#6B6B68", fontFamily: "monospace" }}>
                    {listingInfo.landlordPhone}
                  </p>
                </div>
              </div>
              <div style={{
                marginLeft: "auto", backgroundColor: "#EAF4EE",
                borderRadius: 8, padding: "4px 10px",
              }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#1B4332" }}>
                  Verified Landlord
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <User size={16} color="#6B6B68" />
              <span style={{ fontSize: 13, color: "#6B6B68" }}>Landlord info unavailable</span>
            </div>
          )}
        </div>

        {/* Warning Message & Checkbox */}
        <div style={{
          backgroundColor: "#FDF3D0", border: "0.5px solid #F6D666",
          borderRadius: 12, padding: "14px 16px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <AlertCircle size={20} color="#D4A017" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#1A1A18", lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 700 }}>Ensure agreement:</strong> Please verify that you have reached an agreement with the landlord before proceeding with this payment.
            </p>
          </div>
          
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderTop: "0.5px solid rgba(212, 160, 23, 0.2)", paddingTop: 12 }}>
            <input 
              type="checkbox" 
              checked={agreementChecked}
              onChange={(e) => setAgreementChecked(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#1B4332", cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: "#1A1A18", fontWeight: 500, userSelect: "none" }}>
              I confirm that I have agreed with the landlord.
            </span>
          </label>
        </div>

        {/* Provider Selection */}
        <p style={{ fontSize: 13, fontWeight: 600, color: "#6B6B68", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Pay with
        </p>

        {/* MTN */}
        <button
          onClick={() => setProvider("mtn")}
          style={{
            width: "100%", borderRadius: 12,
            border: provider === "mtn" ? "1.5px solid #1B4332" : "0.5px solid #E8E4DC",
            backgroundColor: provider === "mtn" ? "#EAF4EE" : "#FFFFFF",
            padding: "14px 16px", marginBottom: 10,
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#FFC800", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#1A1A18", flexShrink: 0 }}>
            MTN
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>MTN Mobile Money</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B6B68" }}>Pay via MTN MoMo push</p>
          </div>
          {provider === "mtn" && <CheckCircle2 size={18} color="#1B4332" style={{ marginLeft: "auto" }} />}
        </button>

        {/* Orange */}
        <button
          onClick={() => setProvider("orange")}
          style={{
            width: "100%", borderRadius: 12,
            border: provider === "orange" ? "1.5px solid #1B4332" : "0.5px solid #E8E4DC",
            backgroundColor: provider === "orange" ? "#EAF4EE" : "#FFFFFF",
            padding: "14px 16px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#FF6B00", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#FFFFFF", flexShrink: 0 }}>
            OM
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>Orange Money</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B6B68" }}>Pay via Orange Money push</p>
          </div>
          {provider === "orange" && <CheckCircle2 size={18} color="#1B4332" style={{ marginLeft: "auto" }} />}
        </button>

        {/* Your Phone Number Input */}
        <p style={{ fontSize: 13, fontWeight: 600, color: "#6B6B68", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Your mobile number
        </p>
        <p style={{ fontSize: 12, color: "#A8A8A5", marginBottom: 8 }}>
          The USSD push will be sent to this number to confirm the payment.
        </p>
        <div style={{
          display: "flex", alignItems: "center",
          backgroundColor: "#FFFFFF",
          border: "0.5px solid #E8E4DC",
          borderRadius: 12, overflow: "hidden", marginBottom: 8,
        }}>
          <span style={{
            padding: "14px 12px",
            fontSize: 15, fontWeight: 600, color: "#1A1A18",
            borderRight: "0.5px solid #E8E4DC", backgroundColor: "#F9F7F2",
            userSelect: "none", flexShrink: 0,
          }}>
            +237
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9 ]/g, "");
              if (v.replace(/\s/g, "").length <= 9) setPhone(v);
            }}
            placeholder="6 XX XX XX XX"
            style={{
              flex: 1, padding: "14px 12px",
              fontSize: 15, border: "none", outline: "none",
              backgroundColor: "transparent", color: "#1A1A18",
            }}
          />
        </div>
        {phone && !isPhoneValid && (
          <p style={{ fontSize: 12, color: "#C0392B", margin: "0 0 16px" }}>
            Must be 9 digits starting with 6
          </p>
        )}

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: "#FEF2F2", border: "0.5px solid #FCA5A5",
            borderRadius: 10, padding: "12px 14px", marginBottom: 16,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>{error}</p>
          </div>
        )}

        {/* USSD Waiting state */}
        {waitingUSSD && (
          <div style={{
            backgroundColor: "#EAF4EE", border: "0.5px solid #B7D9C4",
            borderRadius: 10, padding: "14px 16px", marginBottom: 16,
            textAlign: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 16, height: 16, border: "2px solid #B7D9C4", borderTopColor: "#1B4332", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1B4332" }}>Waiting for approval...</p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6B6B68" }}>Check your phone for the USSD push</p>
          </div>
        )}
      </div>

      {/* Sticky Pay Button */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        backgroundColor: "#FFFFFF", borderTop: "0.5px solid #E8E4DC",
        padding: "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}>
        {listingInfo && (
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6B6B68", textAlign: "center" }}>
            Funds will be sent to <strong style={{ color: "#1A1A18" }}>{listingInfo.landlordName}</strong> ({listingInfo.landlordPhone})
          </p>
        )}
        <button
          onClick={handlePay}
          disabled={!canPay}
          style={{
            width: "100%", height: 52, borderRadius: 12,
            backgroundColor: canPay ? "#D4A017" : "#E8E4DC",
            color: canPay ? "#FFFFFF" : "#A8A8A5",
            fontSize: 16, fontWeight: 700, border: "none",
            cursor: canPay ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isLoading ? (
            <>
              <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#FFFFFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Processing...
            </>
          ) : (
            `Pay ₣${displayAmount.toLocaleString()} FCFA`
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
