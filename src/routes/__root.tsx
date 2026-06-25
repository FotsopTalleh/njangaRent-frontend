import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useUser, useAuth } from "@clerk/clerk-react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NjangaRent — Find your home in Buea, Cameroon" },
      { name: "description", content: "Browse verified rooms, studios, and apartments across Buea — Molyko, Bonduma, Great Soppo, Buea Town and more. Message landlords, book viewings, pay rent via Mobile Money." },
      { name: "author", content: "NjangaRent" },
      { name: "theme-color", content: "#1B4332" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "NjangaRent" },
      { property: "og:title", content: "NjangaRent — Find your home in Buea" },
      { property: "og:description", content: "Verified housing across Buea, Cameroon. Rooms, studios, apartments — message landlords, pay via MoMo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NjangaRent" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const hideTabs = 
    currentPath.startsWith("/listing/") || 
    currentPath.includes("/messages/") || 
    currentPath.startsWith("/payments/");

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ThemeBoot />
        <AuthSync />
        <Outlet />
        <div style={{ display: hideTabs ? "none" : "block" }}>
          <BottomTabBar />
        </div>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function AuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionActive = useAuthStore((s) => s.setSessionActive);
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      // ── Session is active ────────────────────────────────────────────────
      const role = ((user.unsafeMetadata?.role as string) || "tenant") as import("@/store/authStore").UserRole;
      const email = user.emailAddresses[0]?.emailAddress || "";
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || email;

      // Sync user to backend DB (non-blocking, best-effort)
      getToken().then(async (token) => {
        try {
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (_) { /* non-fatal */ }
      });

      setUser({ id: user.id, email, name, role, status: "ACTIVE", avatarUrl: user.imageUrl });
      setSessionActive(true);

      // On first sync after login: redirect away from public pages
      if (!hasSynced) {
        setHasSynced(true);
        const currentPath = router.state.location.pathname;
        const publicPaths = ["/", "/login", "/signup", "/sso-callback", "/forgot-password"];
        if (publicPaths.includes(currentPath)) {
          const dest = role === "landlord" ? "/landlord/dashboard"
                     : role === "admin"    ? "/admin/dashboard"
                     : "/student/dashboard";
          router.navigate({ to: dest });
        }
      }
    } else if (!isSignedIn && hasSynced) {
      // ── Session ended (signed out or token expired) ──────────────────────
      clearSession();
      setHasSynced(false);
      const currentPath = router.state.location.pathname;
      const protectedPrefixes = ["/landlord", "/admin", "/student", "/tenant", "/profile"];
      if (protectedPrefixes.some((p) => currentPath.startsWith(p))) {
        router.navigate({ to: "/login" });
      }
    } else if (!isSignedIn) {
      // ── Initial page load with no session ──────────────────────────────
      clearSession();
    }
  }, [isLoaded, isSignedIn, user, getToken, setUser, setSessionActive, clearSession, hasSynced, router]);

  return null;
}

function ThemeBoot() {
  const init = useThemeStore((s) => s.init);
  useEffect(() => init(), [init]);
  return null;
}
