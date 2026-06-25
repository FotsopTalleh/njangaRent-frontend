import { Calendar, Clock, CheckCircle2, XCircle, RotateCcw, Ban, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Appointment, AppointmentStatus } from "@/api/appointments.api";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pending:     { label: "Pending",     color: "text-warning bg-warning/10",   icon: AlertCircle  },
  confirmed:   { label: "Confirmed",   color: "text-success bg-success/10",   icon: CheckCircle2 },
  rescheduled: { label: "Rescheduled", color: "text-primary bg-primary/10",   icon: RotateCcw    },
  declined:    { label: "Declined",    color: "text-destructive bg-destructive/10", icon: XCircle },
  completed:   { label: "Completed",   color: "text-success bg-success/10",   icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   color: "text-muted-foreground bg-muted", icon: Ban        },
  expired:     { label: "Expired",     color: "text-muted-foreground bg-muted", icon: Clock       },
};

const SLOT_LABELS: Record<string, string> = {
  morning:   "Morning (8am–12pm)",
  afternoon: "Afternoon (12pm–4pm)",
  evening:   "Evening (4pm–7pm)",
};

interface AppointmentCardProps {
  appointment: Appointment;
  role: "student" | "landlord";
  onConfirm?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  className?: string;
}

export function AppointmentCard({
  appointment: appt,
  role,
  onConfirm,
  onDecline,
  onCancel,
  onComplete,
  className,
}: AppointmentCardProps) {
  const cfg   = STATUS_CONFIG[appt.status];
  const Icon  = cfg.icon;
  const date  = appt.counterDate ?? appt.proposedDate;
  const slot  = appt.counterSlot ?? appt.proposedSlot;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        className,
      )}
      aria-label={`Appointment on ${date} — ${cfg.label}`}
    >
      {/* Status + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold">{date}</span>
          <span className="text-xs text-muted-foreground">&mdash; {SLOT_LABELS[slot] ?? slot}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
            cfg.color,
          )}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {cfg.label}
        </span>
      </div>

      {/* Notes */}
      {appt.studentNote && (
        <p className="text-xs text-muted-foreground italic">
          Student note: {appt.studentNote}
        </p>
      )}
      {appt.landlordNote && (
        <p className="text-xs text-muted-foreground italic">
          Landlord note: {appt.landlordNote}
        </p>
      )}
      {appt.declineReason && (
        <p className="text-xs text-destructive">
          Decline reason: {appt.declineReason}
        </p>
      )}

      {/* Actions */}
      {role === "landlord" && appt.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => onConfirm?.(appt.id)} className="h-8 text-xs">
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDecline?.(appt.id)} className="h-8 text-xs">
            Decline
          </Button>
        </div>
      )}
      {role === "landlord" && appt.status === "confirmed" && (
        <Button size="sm" variant="outline" onClick={() => onComplete?.(appt.id)} className="h-8 text-xs">
          Mark complete
        </Button>
      )}
      {role === "student" && (appt.status === "pending" || appt.status === "confirmed") && (
        <Button size="sm" variant="ghost" onClick={() => onCancel?.(appt.id)} className="h-8 text-xs text-destructive hover:text-destructive">
          Cancel
        </Button>
      )}
    </div>
  );
}
