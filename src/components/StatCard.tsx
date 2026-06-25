import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 shadow-soft",
        className,
      )}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {trend && (
        <p
          className={cn(
            "text-xs font-medium",
            trend.value >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
        </p>
      )}
    </div>
  );
}
