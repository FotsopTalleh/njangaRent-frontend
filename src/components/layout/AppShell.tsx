import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2, LayoutDashboard, LogOut, Menu, Moon, Sun, Users, Receipt,
  FileCheck, Bell, MessageSquare, Calendar, MapPin, ShieldCheck,
  BarChart3, BookmarkCheck, Settings, CreditCard, Home,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/clerk-react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: "notifications" | "unread";
}

interface AppShellProps {
  variant: "landlord" | "tenant" | "student" | "admin";
  children: ReactNode;
}

const landlordNav: NavItem[] = [
  { to: "/landlord/dashboard",       label: "Dashboard",     icon: LayoutDashboard },
  { to: "/landlord/listings",        label: "Listings",      icon: Building2 },
  { to: "/landlord/properties",      label: "Properties",    icon: MapPin },
  { to: "/landlord/tenants",         label: "Tenants",       icon: Users },
  { to: "/landlord/appointments",    label: "Appointments",  icon: Calendar },
  { to: "/landlord/inbox",           label: "Inbox",         icon: MessageSquare, badge: "unread" },
  { to: "/landlord/payments/review", label: "Payments",      icon: FileCheck },
  { to: "/landlord/receipts",        label: "Receipts",      icon: Receipt },
  { to: "/landlord/notifications",   label: "Notifications", icon: Bell, badge: "notifications" },
];

const studentNav: NavItem[] = [
  { to: "/student/dashboard",         label: "Home",          icon: Home },
  { to: "/explore",                   label: "Explore",       icon: Building2 },
  { to: "/student/listings/saved",    label: "Saved",         icon: BookmarkCheck },
  { to: "/student/appointments",      label: "Appointments",  icon: Calendar },
  { to: "/student/inbox",             label: "Inbox",         icon: MessageSquare, badge: "unread" },
  { to: "/student/payments",          label: "Payments",      icon: CreditCard },
  { to: "/student/receipts",          label: "Receipts",      icon: Receipt },
  { to: "/student/notifications",     label: "Alerts",        icon: Bell, badge: "notifications" },
];

// Legacy tenant nav — keeps existing routes functional
const tenantNav: NavItem[] = [
  { to: "/tenant/dashboard",     label: "Home",          icon: LayoutDashboard },
  { to: "/explore",              label: "Explore",       icon: Building2 },
  { to: "/tenant/upload",        label: "Upload",        icon: FileCheck },
  { to: "/tenant/payments",      label: "Payments",      icon: Receipt },
  { to: "/tenant/notifications", label: "Alerts",        icon: Bell },
];

const adminNav: NavItem[] = [
  { to: "/admin/dashboard",                  label: "Dashboard",          icon: BarChart3 },
  { to: "/admin/verifications/landlords",    label: "Landlord Verify",    icon: ShieldCheck },
  { to: "/admin/verifications/students",     label: "Tenant Verify",      icon: Users },
  { to: "/admin/listings",                   label: "Listings",           icon: Building2 },
  { to: "/admin/users",                      label: "Users",              icon: Users },
  { to: "/admin/payments",                   label: "Payments",           icon: CreditCard },
  { to: "/admin/messages",                   label: "Messages",           icon: MessageSquare },
  { to: "/admin/settings",                   label: "Settings",           icon: Settings },
];

function navFor(variant: AppShellProps["variant"]) {
  switch (variant) {
    case "landlord": return landlordNav;
    case "student":  return studentNav;
    case "tenant":   return tenantNav;
    case "admin":    return adminNav;
  }
}

export function AppShell({ variant, children }: AppShellProps) {
  const nav = navFor(variant);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuthStore((s) => s.user);
  const { theme, toggle, init } = useThemeStore();
  const unread = useNotificationStore((s) => s.unreadCount());
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    // AuthSync will detect isSignedIn=false, clearSession(), and redirect to /login
  };

  useEffect(() => init(), [init]);

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
          <BrandMark />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.badge === "notifications" && unread > 0 && (
                  <span className="text-[10px] font-semibold rounded-full bg-accent text-accent-foreground px-2 py-0.5 min-w-[20px] text-center">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center text-sm font-semibold uppercase shrink-0">
              {user?.name?.[0] ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 lg:px-8 gap-3">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-xl"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </header>

        <motion.main
          key={path}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-10"
        >
          {children}
        </motion.main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur" aria-label="Mobile navigation">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(nav.length, 5)}, 1fr)` }}>
            {nav.slice(0, 5).map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium relative",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground p-4 flex flex-col"
            >
              <div className="h-12 flex items-center px-2 mb-2">
                <BrandMark />
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto">
                {nav.map((item) => {
                  const active = path === item.to || path.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "hover:bg-sidebar-accent text-sidebar-foreground/80",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent text-sidebar-foreground/80"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
              </button>
            </motion.aside>
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
        <Home className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-base text-sidebar-foreground">NjangaRent</span>
      )}
    </Link>
  );
}
