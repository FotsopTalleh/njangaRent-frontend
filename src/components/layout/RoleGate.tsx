import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuthStore, type UserRole, dashboardForRole } from "@/store/authStore";
import { useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

interface RoleGateProps {
  /** Single role or array of accepted roles. */
  role: UserRole | UserRole[];
  children: ReactNode;
}

export function RoleGate({ role, children }: RoleGateProps) {
  const { isLoaded, isSignedIn } = useUser();           // Clerk is authoritative
  const user = useAuthStore((s) => s.user);

  // SSR-safe mount guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Waiting for mount (SSR hydration) or for Clerk to finish loading
  if (!mounted || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Clerk says not signed in → send to login
  if (!isSignedIn) return <Navigate to="/login" />;

  // User profile not yet synced from Clerk → still loading
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // PENDING / REJECTED / BANNED status
  if (user.status === "PENDING" || user.status === "REJECTED" || user.status === "BANNED") {
    return <Navigate to="/verify-pending" />;
  }

  // tenant is an alias for student in legacy routes
  const effectiveRole: UserRole = user.role === "tenant" ? "student" : user.role;
  const allowed = Array.isArray(role) ? role : [role];

  // Wrong role → redirect to own dashboard
  if (!allowed.includes(effectiveRole) && !allowed.includes(user.role)) {
    return <Navigate to={dashboardForRole(effectiveRole)} />;
  }

  return <>{children}</>;
}
