import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/api/axiosClient";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Bell } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/visits")({
  head: () => ({ meta: [{ title: "My Visits — NjangaRent" }] }),
  component: VisitsPage,
});

function VisitsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prevRef = useRef<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["visits", "booked"],
    queryFn: async () => {
      const res = await axiosClient.get("/visits/booked");
      return res.data;
    },
    refetchInterval: 5000,
  });

  const visits = data?.data || [];

  useEffect(() => {
    if (visits.length && prevRef.current.length) {
      visits.forEach((v: any) => {
        const prev = prevRef.current.find((p: any) => p.id === v.id);
        if (prev && prev.status !== v.status) {
          if (v.status === "confirmed") toast.success("Your visit is confirmed!");
          else if (v.status === "cancelled") toast.error("Landlord declined this slot. Pick another time.");
        }
      });
    }
    prevRef.current = visits;
  }, [visits]);

  const cancelVisit = useMutation({
    mutationFn: async (slotId: string) => {
      const res = await axiosClient.patch(`/visits/slots/${slotId}`, { status: "cancelled" });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Visit cancelled");
      queryClient.invalidateQueries({ queryKey: ["visits", "booked"] });
    },
    onError: () => toast.error("Could not cancel visit"),
  });

  return (
    <div style={{ backgroundColor: "#F9F7F2", minHeight: "100vh", paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "#F9F7F2",
        borderBottom: "0.5px solid #E8E4DC",
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: "max(12px, env(safe-area-inset-top))",
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1A1A18" }}>Visits</h1>
        <button
          onClick={() => navigate({ to: "/tenant/notifications" })}
          style={{ position: "relative", padding: 8, borderRadius: "50%", backgroundColor: "#FFFFFF", border: "0.5px solid #E8E4DC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Bell size={20} color="#1A1A18" />
        </button>
      </div>

      <div style={{ padding: "16px 16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#6B6B68", fontSize: 14 }}>Loading visits...</div>
        ) : visits.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, textAlign: "center", gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#EAF4EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={32} color="#B7D9C4" />
            </div>
            <p style={{ fontSize: 15, color: "#6B6B68", fontWeight: 500, margin: 0 }}>No visits booked yet.</p>
            <p style={{ fontSize: 13, color: "#A8A8A5", margin: 0 }}>Schedule a visit from a listing page.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visits.map((visit: any) => {
              const isConfirmed = visit.status === "confirmed";
              const isPending = visit.status === "pending";
              const isCancelled = visit.status === "cancelled";
              const d = new Date(visit.slot_datetime);

              const statusColor = isConfirmed ? "#1B4332" : isPending ? "#D4A017" : "#C0392B";
              const statusBg = isConfirmed ? "#EAF4EE" : isPending ? "#FDF3D0" : "#FEF2F2";
              const StatusIcon = isConfirmed ? CheckCircle : isPending ? AlertCircle : XCircle;

              return (
                <div key={visit.id} style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  border: "0.5px solid #E8E4DC",
                  overflow: "hidden",
                  display: "flex",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                  {/* Left border indicator */}
                  <div style={{ width: 5, backgroundColor: statusColor, flexShrink: 0 }} />

                  <div style={{ flex: 1, padding: "14px 14px" }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "#1A1A18" }}>
                      {visit.listing?.title || "Property Visit"}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6B6B68" }}>
                        <Calendar size={13} />
                        {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6B6B68" }}>
                        <Clock size={13} />
                        {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        backgroundColor: statusBg, color: statusColor,
                        fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                      }}>
                        <StatusIcon size={12} />
                        <span style={{ textTransform: "capitalize" }}>{visit.status}</span>
                      </div>
                      {isPending && (
                        <button
                          onClick={() => cancelVisit.mutate(visit.id)}
                          disabled={cancelVisit.isPending}
                          style={{
                            fontSize: 13, fontWeight: 600, color: "#C0392B",
                            background: "none", border: "none", cursor: "pointer", padding: "6px 10px",
                            opacity: cancelVisit.isPending ? 0.5 : 1,
                          }}
                        >
                          {cancelVisit.isPending ? "..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
