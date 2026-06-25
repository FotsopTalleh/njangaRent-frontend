import { Link, useRouterState } from "@tanstack/react-router";
import {
  Map, Search, MessageCircle, Calendar, User,
  Home, Inbox, CreditCard, LayoutDashboard, ShieldCheck, List, Users, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

interface TabItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: "messages" | "notifications";
}

const tenantTabs: TabItem[] = [
  { to: "/explore",   label: "Explore",   icon: Map },
  { to: "/search",    label: "Search",    icon: Search },
  { to: "/messages",  label: "Messages",  icon: MessageCircle, badge: "messages" },
  { to: "/visits",    label: "Visits",    icon: Calendar },
  { to: "/profile",   label: "Profile",   icon: User },
];

const landlordTabs: TabItem[] = [
  { to: "/landlord/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { to: "/landlord/listings",  label: "Listings", icon: Home },
  { to: "/landlord/inbox",     label: "Inquiries",  icon: Inbox, badge: "messages" },
  { to: "/landlord/payments/review",    label: "Payments",  icon: CreditCard },
  { to: "/profile",     label: "Profile",   icon: User },
];

const adminTabs: TabItem[] = [
  { to: "/admin/dashboard",             label: "Overview",      icon: LayoutDashboard },
  { to: "/admin/verifications/landlords", label: "Verify",      icon: ShieldCheck },
  { to: "/admin/listings",              label: "Listings",       icon: List },
  { to: "/admin/users",                 label: "Users",          icon: Users },
  { to: "/admin/payments",              label: "Payments",       icon: CreditCard },
];

// Routes where the tab bar should be hidden (full-screen experiences)
const HIDDEN_ON = ["/messages/", "/listing/", "/payments/", "/sso-callback", "/login", "/signup", "/onboarding", "/landlord", "/admin", "/tenant", "/student"];

export function BottomTabBar() {
  const role = useAuthStore((s) => s.user?.role);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unread = useNotificationStore((s) => s.unreadCount());

  // Hide on full-screen routes
  if (!role || path === "/" || HIDDEN_ON.some((prefix) => path.startsWith(prefix))) return null;

  const tabs =
    role === "landlord" ? landlordTabs :
    role === "admin"    ? adminTabs    :
                          tenantTabs;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
      role="tablist"
    >
      <ul className="flex items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = path === tab.to || path.startsWith(tab.to + "/");
          const badgeCount = tab.badge === "messages" || tab.badge === "notifications" ? unread : 0;

          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] w-full transition-colors duration-150",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}

                <span className="relative">
                  <Icon
                    className={cn("h-5 w-5 transition-transform duration-150", isActive && "scale-110")}
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </span>

                <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-primary" : "text-muted-foreground/80")}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
