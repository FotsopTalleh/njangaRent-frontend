import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Mail } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-pending")({
  component: VerifyPending,
});

function VerifyPending() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const status = user?.status ?? "PENDING";

  const config = (
    {
      PENDING: {
        icon:    <Clock className="h-14 w-14 text-warning" aria-hidden="true" />,
        title:   "Verification in progress",
        message: "Your account has been created and is awaiting admin verification. This typically takes 24–48 hours. You will receive an email once your account is approved.",
      },
      REJECTED: {
        icon:    <Mail className="h-14 w-14 text-destructive" aria-hidden="true" />,
        title:   "Verification not approved",
        message: "Your account verification was not approved. Please contact support at support@njangrent.cm for assistance.",
      },
      BANNED: {
        icon:    <Mail className="h-14 w-14 text-destructive" aria-hidden="true" />,
        title:   "Account suspended",
        message: "Your account has been suspended. Please contact support at support@njangrent.cm.",
      },
    } as Record<string, { icon: React.ReactNode; title: string; message: string }>
  )[status] ?? {
    icon:    <Clock className="h-14 w-14 text-warning" aria-hidden="true" />,
    title:   "Account pending",
    message: "Your account is not yet active. Please wait for admin approval.",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">{config.icon}</div>

        <div>
          <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {config.message}
          </p>
        </div>

        {user && (
          <div className="rounded-xl bg-muted p-4 text-left text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate ml-4">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user.role}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/listings">Browse listings while you wait</Link>
          </Button>
          <button
            onClick={() => { logout(); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
