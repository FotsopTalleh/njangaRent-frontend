import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function VerificationBadge({ className, size = "sm" }: VerificationBadgeProps) {
  return (
    <span
      aria-label="Verified landlord"
      title="Verified by NjangaRent"
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm"
          ? "text-[10px] px-1.5 py-0.5 bg-success/10 text-success"
          : "text-xs px-2 py-1 bg-success/10 text-success",
        className,
      )}
    >
      <ShieldCheck
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        aria-hidden="true"
      />
      Verified
    </span>
  );
}
