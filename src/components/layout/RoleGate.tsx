import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuthStore, type UserRole } from "@/store/authStore";
import { Loader2 } from "lucide-react";

/** Map each role to its home route. */
function homeFor(role: UserRole): string {
  switch (role) {
    case "landlord": return "/landlord/dashboard";
    case "student":  return "/student/dashboard";
    case "tenant":   return "/student/dashboard"; // tenants redirect to student
    case "admin":    return "/admin/dashboard";
  }
}

interface RoleGateProps {
  /** Single role or array of accepted roles. */
  role: UserRole | UserRole[];
  children: ReactNode;
}

export function RoleGate({ role, children }: RoleGateProps) {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  // SSR-safe mount guard — see original comment in MyTenant source.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" />;

  // PENDING status — redirect to verification pending page
  if (user.status === "PENDING") return <Navigate to="/verify-pending" />;
  if (user.status === "REJECTED") return <Navigate to="/verify-pending" />;
  if (user.status === "BANNED") return <Navigate to="/verify-pending" />;

  const allowed = Array.isArray(role) ? role : [role];
  // tenant is an alias for student in legacy routes
  const effectiveRole: UserRole = user.role === "tenant" ? "student" : user.role;

  if (!allowed.includes(effectiveRole) && !allowed.includes(user.role)) {
    return <Navigate to={homeFor(effectiveRole)} />;
  }

  return <>{children}</>;
}
